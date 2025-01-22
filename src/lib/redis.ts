import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createClient, type RedisClientType } from 'redis';

/** The global redis client used by the Weird server. */
export let redis: RedisClientType = null as any;

export async function initRedis() {
	redis = (await createClient({
		url: env.REDIS_URL
	})
		.on('error', (err) => console.error('Redis client error', err))
		.connect()) as RedisClientType;
}
