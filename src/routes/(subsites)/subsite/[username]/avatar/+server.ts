import { createImageResponse } from '$lib/image';
import { profileLinkByUsername } from '$lib/leaf/profile';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
	const profileLink = await profileLinkByUsername(params.username!);
	if (!profileLink) return error(404, 'Avatar not found');
	return await createImageResponse(profileLink, url, fetch);
};
