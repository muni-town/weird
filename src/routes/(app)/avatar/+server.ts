import { createImageResponse } from '$lib/image';
import { profileLinkById } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(404);

	const profileLink = await profileLinkById(sessionInfo.user_id);
	if (!profileLink) return error(404, 'Avatar not found');
	return await createImageResponse(profileLink, url, fetch);
};
