import { createImageResponse } from '$lib/image';
import { profileLinkByUsername } from '$lib/leaf/profile';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const profileLink = await profileLinkByUsername(params.username!);
	if (!profileLink) return error(404, 'Avatar not found');
	return await createImageResponse(profileLink, fetch, params.username);
};

export const fallback: RequestHandler = async ({ request }) => {
	console.error('AVATAR REQ FALLBACK:', request);
	return new Response(null, { status: 400, statusText: 'Method not supported' });
};

