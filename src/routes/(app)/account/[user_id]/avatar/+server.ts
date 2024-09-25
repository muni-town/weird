import { createImageResponse } from '$lib/image';
import { profileLinkById } from '$lib/leaf/profile';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const profileLink = await profileLinkById(params.user_id!);
	if (!profileLink) return error(404, 'Avatar not found');
	return createImageResponse(profileLink, fetch, params.user_id);
};
