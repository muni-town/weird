import { env } from '$env/dynamic/private';
import { createClient } from 'redis';

/** The global redis client used by the Weird server. */
export const redis = await createClient({ url: env.REDIS_URL })
	.on('error', (err) => console.error('Redis client error', err))
	.connect();
