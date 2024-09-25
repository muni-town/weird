import { env } from '$env/dynamic/public';
import { createImageResponse } from '$lib/image';
import { profileLinkByDomain, profileLinkByUsername } from '$lib/leaf/profile';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, fetch }) => {
	let profileLink = await profileLinkByUsername(`${params.usernameOrDomain}@${env.PUBLIC_DOMAIN}`);
	if (!profileLink) {
		profileLink = await profileLinkByDomain(params.usernameOrDomain!);
		if (!profileLink) {
			return new Response(undefined, {
				status: 404,
				statusText: `User or domain not found for "${params.usernameOrDomain}`
			});
		}
	}
	return await createImageResponse(profileLink, fetch, params.usernameOrDomain);
};
