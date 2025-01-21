import { getFaviconDataUri } from '$lib/utils/social-links';
import { error, type RequestHandler } from '@sveltejs/kit';
import { redis } from '$lib/redis';

export const GET: RequestHandler = async ({ params }) => {
	const url = new URL(decodeURIComponent(params.url!));
	const cacheKey = `weird:cache:favicons:${url.hostname}`;
	let dataUri = await redis.get(cacheKey);

	if (!dataUri) {
		dataUri = (await getFaviconDataUri(url.href)) || null;
		if (!dataUri) return error(404, 'Could not find favicon');
		await redis.set(cacheKey, dataUri, { EX: 60 * 60 * 24 * 3 });
	} else {
		await redis.expire(cacheKey, 60 * 60 * 24 * 3);
	}

	return new Response(dataUri);
};
