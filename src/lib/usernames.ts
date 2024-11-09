import { redis } from '$lib/redis';
import { validUsernameRegex } from './utils/username';

const USER_NAMES_PREFIX = 'weird:users:names:';
const USER_RAUTHY_IDS_PREFIX = 'weird:users:rauthyIds:';
const USER_SUBSPACES_PREFIX = 'weird:users:subspaces:';

export async function claimUsername(username: string, rauthyId: string, subspace: string) {
	if (!username.match(validUsernameRegex)) {
		throw 'Username does not pass valid username check.';
	}

	const usernameKey = USER_NAMES_PREFIX + username;
	const rauthyIdKey = USER_RAUTHY_IDS_PREFIX + rauthyId;
	const subspaceKey = USER_SUBSPACES_PREFIX + subspace;

	const TRIES = 3;
	const failures = 0;
	while (failures <= TRIES) {
		redis.watch([usernameKey, rauthyIdKey, subspaceKey]);

		if (await redis.exists(usernameKey)) {
			await redis.unwatch();
			throw `Cannot claim username "${username}": username already claimed.`;
		}

		const multi = redis.multi();

		multi.del(usernameKey);
		multi.hSet(usernameKey, 'subspace', subspace);
		multi.hSet(usernameKey, 'rauthyId', rauthyId);
		multi.del(rauthyIdKey);
		multi.hSet(rauthyIdKey, 'username', username);
		multi.hSet(rauthyIdKey, 'subspace', subspace);
		multi.del(subspaceKey);
		multi.hSet(subspaceKey, 'username', username);
		multi.hSet(subspaceKey, 'rauthyId', rauthyId);

		try {
			await multi.exec();
			return;
		} catch (e) {
			console.warn(
				`Initial attempt to claim username ${username} failed will try ${TRIES - failures} more times: ${e}`
			);
		}
	}
}

export async function deleteUsername(username: string) {
	const usernameKey = USER_NAMES_PREFIX + username;

	await redis.watch(usernameKey);

	const user = await redis.hGetAll(usernameKey);

	const multi = redis.multi();

	multi.del(usernameKey);
	if (user.subspace) {
		multi.del(USER_SUBSPACES_PREFIX + user.subspace);
	}
	if (user.rauthyId) {
		multi.del(USER_RAUTHY_IDS_PREFIX + user.rauthyId);
	}

	await multi.exec();
}

export async function listUsers(): Promise<
	{
		username: string;
		rauthyId: string;
		subspace: string;
	}[]
> {
	const userKeys = await redis.keys(USER_NAMES_PREFIX + '*');
	return (
		await Promise.all(
			userKeys.map(async (key) => {
				try {
					const segments = key.split(':');
					const username = segments[segments.length - 1];
					const data = await redis.hGetAll(key);
					const rauthyId = data.rauthyId;
					const subspace = data.subspace;

					return { username, rauthyId, subspace };
				} catch (_) {
					return undefined;
				}
			})
		)
	).filter((x) => !!x) as { username: string; rauthyId: string; subspace: string }[];
}
