import { createImageResponse } from '$lib/image';
import { profileLinkByUsername } from '$lib/leaf/profile';
import { usernames } from '$lib/usernames';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
	const username = usernames.fullDomain(params.username!);

	const profileLink = await profileLinkByUsername(username);
	if (!profileLink) return error(404, 'Avatar not found');
	return await createImageResponse(profileLink, url, fetch);
};
