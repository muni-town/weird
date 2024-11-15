import { redis } from '$lib/redis';
import { base32Decode, base32Encode, type SubspaceId } from 'leaf-proto';
import { leafClient } from './leaf';
import { env } from '$env/dynamic/public';
import { resolveAuthoritative } from './dns/resolve';
import { APP_IPS } from './dns/server';

export const validUsernameRegex = /^([a-z0-9][_-]?){3,32}$/;

const USER_NAMES_PREFIX = 'weird:users:names:';
const USER_RAUTHY_IDS_PREFIX = 'weird:users:rauthyIds:';
const USER_SUBSPACES_PREFIX = 'weird:users:subspaces:';

export async function setUserSubspace(rauthyId: string, subspace: SubspaceId) {
	const sspace = base32Encode(subspace);
	await redis.hSet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'subspace', sspace);
	await redis.hSet(USER_SUBSPACES_PREFIX + sspace, 'rauthyId', rauthyId);
}

export async function claimUsername(
	input: { username: string } | { domain: string },
	rauthyId: string
) {
	const rauthyIdKey = USER_RAUTHY_IDS_PREFIX + rauthyId;

	const subspace = base32Encode(await userSubspaceByRauthyId(rauthyId));
	const subspaceKey = USER_SUBSPACES_PREFIX + subspace;

	let username;
	if ('username' in input) {
		// Claiming a local username

		if (!input.username.match(validUsernameRegex)) {
			throw 'Username does not pass valid username check.';
		} else {
			username = input.username + '.' + env.PUBLIC_USER_DOMAIN_PARENT;
		}
	} else {
		// Claim a custom domain
		const isApex = input.domain.split('.').length == 2;

		if (isApex) {
			const ips = await resolveAuthoritative(input.domain, 'A');
			let matches = 0;
			for (const ip of ips) {
				if (ip in APP_IPS) {
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
		}

		throw "Can't use custom domains yet";

		// username = input.domain;
	}

	const usernameKey = USER_NAMES_PREFIX + username;

	const TRIES = 3;
	let failures = 0;
	while (failures <= TRIES) {
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

		try {
			await multi.exec();
			return;
		} catch (e) {
			failures += 1;
			console.warn(
				`Initial attempt to claim username ${username} failed will try ${TRIES - failures} more times: ${e}`
			);
		}
	}
}

export async function unsetUsername(username: string) {
	const usernameKey = USER_NAMES_PREFIX + username;

	await redis.watch(usernameKey);

	const user = await redis.hGetAll(usernameKey);

	const multi = redis.multi();

	multi.del(usernameKey);
	if (user.subspace) {
		multi.hDel(USER_SUBSPACES_PREFIX + user.subspace, 'username');
	}
	if (user.rauthyId) {
		multi.hDel(USER_RAUTHY_IDS_PREFIX + user.rauthyId, 'username');
	}

	await multi.exec();
}

export async function* listUsers(): AsyncGenerator<{
	username?: string;
	rauthyId: string;
	subspace: Uint8Array;
}> {
	for await (const key of redis.scanIterator({ MATCH: USER_RAUTHY_IDS_PREFIX + '*' })) {
		const segments = key.split(':');
		const rauthyId = segments[segments.length - 1];
		yield {
			rauthyId,
			username: await userNameByRauthyId(rauthyId),
			subspace: await userSubspaceByRauthyId(rauthyId)
		};
	}
}

export async function userNameByRauthyId(rauthyId: string): Promise<string | undefined> {
	return await redis.hGet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'username');
}

export async function userSubspaceByRauthyId(rauthyId: string): Promise<Uint8Array> {
	let subspaceStr = await redis.hGet(USER_RAUTHY_IDS_PREFIX + rauthyId, 'subspace');
	let subspace;
	if (!subspaceStr) {
		subspace = await leafClient.create_subspace();
		await setUserSubspace(rauthyId, subspace);
		return subspace;
	} else {
		return base32Decode(subspaceStr);
	}
}

export async function userSubspaceByUsername(username: string): Promise<Uint8Array | undefined> {
	const subspaceStr = await redis.hGet(USER_NAMES_PREFIX + username, 'subspace');
	return subspaceStr ? base32Decode(subspaceStr) : undefined;
}
export async function userRauthyIdByUsername(username: string): Promise<string | undefined> {
	return await redis.hGet(USER_NAMES_PREFIX + username, 'rauthyId');
}

export async function userNameAndIdBySubspace(
	subspace: SubspaceId
): Promise<{ username?: string; rauthyId?: string }> {
	const key = USER_SUBSPACES_PREFIX + base32Encode(subspace);
	const username = await redis.hGet(key, 'username');
	const rauthyId = await redis.hGet(key, 'rauthyId');
	return { username, rauthyId };
}
