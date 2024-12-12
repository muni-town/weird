import { redis } from '$lib/redis';
import { base32Decode, base32Encode, type SubspaceId } from 'leaf-proto';
import { leafClient } from '../leaf';
import { env } from '$env/dynamic/public';
import { resolveAuthoritative } from '../dns/resolve';
import { APP_IPS } from '../dns/server';
import {
	validDomainRegex,
	validUsernameRegex,
	validUnsubscribedUsernameRegex,
	genRandomUsernameSuffix
} from './client';
import { dev } from '$app/environment';

const USER_NAMES_PREFIX = 'weird:users:names:';
const USER_RAUTHY_IDS_PREFIX = 'weird:users:rauthyIds:';
const USER_SUBSPACES_PREFIX = 'weird:users:subspaces:';

async function setSubspace(rauthyId: string, subspace: SubspaceId) {
	const sspace = base32Encode(subspace);
	await redis.hSet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'subspace', sspace);
	await redis.hSet(USER_SUBSPACES_PREFIX + sspace, 'rauthyId', rauthyId);
}

async function claim(
	input: { username: string } | { domain: string; skipDomainCheck?: boolean },
	rauthyId: string
) {
	const oldUsername = await getByRauthyId(rauthyId);
	const rauthyIdKey = USER_RAUTHY_IDS_PREFIX + rauthyId;

	const subspace = base32Encode(await subspaceByRauthyId(rauthyId));
	const subspaceKey = USER_SUBSPACES_PREFIX + subspace;

	let username;
	if ('username' in input) {
		// Claiming a local username

		if (!input.username.match(validUsernameRegex)) {
			throw `Username does not pass valid username check: '${input.username}'`;
		} else {
			username = input.username + '.' + env.PUBLIC_USER_DOMAIN_PARENT;
		}
	} else {
		// Claim a custom domain
		const isApex = input.domain.split('.').length == 2;
		const domainWithoutPort = input.domain.split(':')[0];

		if (!input.skipDomainCheck) {
			// Make sure the port matches
			const appPort = env.PUBLIC_DOMAIN.split(':')[1];
			const domainPort = input.domain.split(':')[1];
			if (appPort != domainPort) {
				throw `The port for the specified domain ${domainPort} does not match the port of the weird server ${appPort}.`;
			}

			let tries = 0;
			while (true) {
				try {
					if (isApex) {
						const ips = await resolveAuthoritative(domainWithoutPort, 'A');
						let matches = 0;
						for (const ip of ips) {
							if (ip in APP_IPS || (dev && ip.startsWith('127.'))) {
								matches += 1;
							} else {
								throw `DNS validation failed: ${input.domain} resolves to \
an IP address ${ip} that is not the Weird server.`;
							}
						}

						if (matches == 0) {
							throw `DNS validation failed: ${input.domain} does not resolve \
to the weird server.`;
						}
					} else {
						const cnames = await resolveAuthoritative(domainWithoutPort, 'CNAME');
						if (!(cnames.length == 1 && cnames[0] == env.PUBLIC_DOMAIN.split(':')[0])) {
							throw `Expected a single CNAME record pointing to ${env.PUBLIC_DOMAIN} \
but found ${cnames.length} records: ${cnames}`;
						}
					}

					const txtRecords = await resolveAuthoritative('_weird.' + domainWithoutPort, 'TXT');
					const expectedValue = `subspace=${subspace}`;
					let matches = false;
					for (const record of txtRecords) {
						if (record == expectedValue) {
							matches = true;
							break;
						}
					}
					if (!matches) {
						throw `DNS validation failed: TXT record not found at \`_weird.${domainWithoutPort}\` \
with value "${expectedValue}". Found other values: ${txtRecords.map((v) => `"${v}"`).join(', ')}`;
					}

					break;
				} catch (e) {
					tries += 1;

					if (tries > 5) {
						throw e;
					} else {
						await new Promise((res) => setTimeout(res, 1000));
					}
				}
			}
		}

		username = input.domain;
	}

	const usernameKey = USER_NAMES_PREFIX + username;

	const TRIES = 3;
	let failures = 0;
	while (failures <= TRIES) {
		let initialUsername: string = '';
		let initialUsernameKey: undefined | string;
		if ('username' in input) {
			const existingInitialUsername = await redis.hGet(rauthyIdKey, 'initialUsername');
			if (!existingInitialUsername) {
				initialUsername = input.username;
				if (!initialUsername.match(validUnsubscribedUsernameRegex)) {
					initialUsername += genRandomUsernameSuffix();
				}

				initialUsername += '.' + env.PUBLIC_USER_DOMAIN_PARENT;

				initialUsernameKey = USER_NAMES_PREFIX + initialUsername;
				redis.watch([initialUsernameKey]);

				if (await redis.exists(initialUsernameKey)) {
					await redis.unwatch();
					throw `Cannot claim initial username "${initialUsername}": username already claimed.`;
				}
			}
		}

		redis.watch([usernameKey, rauthyIdKey, subspaceKey]);

		if (await redis.exists(usernameKey)) {
			await redis.unwatch();
			throw `Cannot claim username "${username}": username already claimed.`;
		}

		const multi = redis.multi();

		multi.hSet(usernameKey, 'subspace', subspace);
		multi.hSet(usernameKey, 'rauthyId', rauthyId);
		multi.hSet(rauthyIdKey, 'username', username);
		multi.hSet(subspaceKey, 'username', username);

		if (initialUsername && initialUsernameKey) {
			multi.hSet(initialUsernameKey, 'subspace', subspace);
			multi.hSet(initialUsernameKey, 'rauthyId', rauthyId);
			multi.hSet(rauthyIdKey, 'initialUsername', initialUsername);
		}

		try {
			await multi.exec();

			if (oldUsername) {
				await unset(oldUsername);
			}

			return;
		} catch (e) {
			failures += 1;
			console.warn(
				`Initial attempt to claim username ${username} failed will try ${TRIES - failures} more times: ${e}`
			);
		}
	}

	throw 'Could not claim username after 3 attempts.';
}

async function unset(username: string) {
	const usernameKey = USER_NAMES_PREFIX + username;

	await redis.watch(usernameKey);

	const user = await redis.hGetAll(usernameKey);

	const initialUsername = await getInitialUsername(user.rauthyId);
	if (initialUsername == username) {
		await redis.unwatch();
		// Initial usernames are never unset.
		return;
	}

	const subspaceKey = USER_SUBSPACES_PREFIX + user.subspace;
	const rauthyIdKey = USER_RAUTHY_IDS_PREFIX + user.rauthyId;
	await redis.watch([subspaceKey, rauthyIdKey]);

	const multi = redis.multi();

	multi.del(usernameKey);
	if (username == (await redis.hGet(subspaceKey, 'username'))) {
		multi.hDel(subspaceKey, 'username');
	}
	if (username == (await redis.hGet(rauthyIdKey, 'username'))) {
		multi.hDel(rauthyIdKey, 'username');
	}

	await multi.exec();
}

async function* list(): AsyncGenerator<{
	username?: string;
	initialUsername?: string;
	rauthyId: string;
	subspace: Uint8Array;
}> {
	for await (const key of redis.scanIterator({ MATCH: USER_RAUTHY_IDS_PREFIX + '*' })) {
		const segments = key.split(':');
		const rauthyId = segments[segments.length - 1];
		yield {
			rauthyId,
			initialUsername: await getInitialUsername(rauthyId),
			username: await getByRauthyId(rauthyId),
			subspace: await subspaceByRauthyId(rauthyId)
		};
	}
}

async function getByRauthyId(rauthyId: string): Promise<string | undefined> {
	return await redis.hGet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'username');
}

async function subspaceByRauthyId(rauthyId: string): Promise<Uint8Array> {
	let subspaceStr = await redis.hGet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'subspace');
	let subspace;
	if (!subspaceStr) {
		subspace = await leafClient.create_subspace();
		await setSubspace(rauthyId, subspace);
		return subspace;
	} else {
		return base32Decode(subspaceStr);
	}
}

async function getSubspace(username: string): Promise<Uint8Array | undefined> {
	const subspaceStr = await redis.hGet(USER_NAMES_PREFIX + username, 'subspace');
	return subspaceStr ? base32Decode(subspaceStr) : undefined;
}
async function getRauthyId(username: string): Promise<string | undefined> {
	return await redis.hGet(USER_NAMES_PREFIX + username, 'rauthyId');
}

async function getBySubspace(
	subspace: SubspaceId
): Promise<{ username?: string; rauthyId?: string }> {
	const key = USER_SUBSPACES_PREFIX + base32Encode(subspace);
	const username = await redis.hGet(key, 'username');
	const rauthyId = await redis.hGet(key, 'rauthyId');
	return { username, rauthyId };
}

async function getInitialUsername(rauthyId: string): Promise<string | undefined> {
	return await redis.hGet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'initialUsername');
}

/**
 * Helper function to generate initial usernames for all users without them.
 *
 * This is just used by the admin interface as a way to handle the fact that we didn't originally
 * have a concept of initial usernames and existing users will need one generated.
 */
async function generateInitialUsernamesForAllUsers() {
	for await (const user of list()) {
		if (!user.initialUsername && user.username) {
			let initialUsername;
			if (user.username.endsWith('.' + env.PUBLIC_USER_DOMAIN_PARENT)) {
				const shortName = user.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0];
				initialUsername = shortName + genRandomUsernameSuffix();
			} else {
				initialUsername = user.username.replace(/[^a-zA-Z0-9]/g, '-') + genRandomUsernameSuffix();
			}
			initialUsername += '.' + env.PUBLIC_USER_DOMAIN_PARENT;

			const initialUsernameKey = USER_NAMES_PREFIX + initialUsername;
			redis.watch([initialUsernameKey]);
			if (await redis.exists(initialUsernameKey)) {
				throw "Initial username already exists, try again. That's very unlucky! Try again.";
			}

			const multi = redis.multi();
			multi.hSet(initialUsernameKey, 'rauthyId', user.rauthyId);
			multi.hSet(initialUsernameKey, 'subspace', base32Encode(user.subspace));
			multi.hSet(USER_RAUTHY_IDS_PREFIX + user.rauthyId, 'initialUsername', initialUsername);
			await multi.exec();
		}
	}
}

/**
 * Sets a user's username to their initial username, freeing whatever their current username is.
 *
 * If they do not have an initial username, their username will just be unset.
 */
async function setUsernameToInitialUsername(rauthyId: string) {
	const initialUsername = await getInitialUsername(rauthyId);
	const username = await getByRauthyId(rauthyId);
	if (username) {
		await unset(username);
	}
	if (initialUsername) {
		await redis.hSet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'username', initialUsername);
	}
}

export const usernames = {
	validDomainRegex,
	validUsernameRegex,
	validUnsubscribedUsernameRegex,
	setSubspace,
	claim,
	unset,
	list,
	getByRauthyId,
	subspaceByRauthyId,
	getSubspace,
	getRauthyId,
	getBySubspace,
	getInitialUsername,
	generateInitialUsernamesForAllUsers,
	setUsernameToInitialUsername
};
