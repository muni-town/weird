import { getSession } from '$lib/rauthy/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTheme, profileLinkById } from '$lib/leaf/profile';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ theme?: { data: Uint8Array } }> => {
	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(403, 'Not logged in');
	const profileLink = await profileLinkById(sessionInfo.user_id);
	if (!profileLink) return error(404);

	return { theme: await getTheme(profileLink) };
};
