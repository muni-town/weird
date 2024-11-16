import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createClient, type RedisClientType } from 'redis';

/** The global redis client used by the Weird server. */
export let redis: RedisClientType = null as any;

if (!building) {
	redis = (await createClient({
		url: env.REDIS_URL
		// EXPERIMENTAL: Currently using transactions, aka MULTI, instead.
		// scripts: {
		// 	/** This is meant to claim a new weird username and associate 3 things to each-other:
		// 	 * rauthy user ID, iroh namespace pubkey, the actual username */
		// 	claimUsername: defineScript({
		// 		SCRIPT: `
		// 		local usernameKey = KEYS[1]
		// 		local rauthyIdKey = KEYS[2]
		// 		local subspaceKey = KEYS[3]
		// 		local username = ARGV[1]
		// 		local rauthyId = ARGV[2]
		// 		local subspace = ARGV[3]

		// 		if redis.call("EXISTS", usernameKey) > 0 then
		// 			return redis.error_reply(string.format("USER_EXISTS The username '%s' already exists so it cannot be claimed.", username))
		// 		end

		// 		redis.call("HSET", usernameKey, "subspace", subspace)
		// 		redis.call("HSET", usernameKey, "rauthyId", rauthyId)
		// 		redis.call("HSET", rauthyIdKey, "username", username)
		// 		redis.call("HSET", rauthyIdKey, "subspace", subspace)
		// 		redis.call("HSET", subspaceKey, "username", username)
		// 		redis.call("HSET", subspaceKey, "rauthyId", rauthyId)
		// 		redis.call("HSET", "testing", "dummy", "something")
		// 		`,
		// 		NUMBER_OF_KEYS: 3,
		// 		FIRST_KEY_INDEX: 1,
		// 		transformArguments(username: string, rauthyId: string, subspace: string) {
		// 			return [
		// 				'weird:users:names:' + username,
		// 				'weird:users:rauthyIds:' + rauthyId,
		// 				'weird:users:subspaces:' + subspace,
		// 				username,
		// 				rauthyId,
		// 				subspace
		// 			];
		// 		}
		// 	})
		// }
	})
		.on('error', (err) => console.error('Redis client error', err))
		.connect()) as RedisClientType;
}
