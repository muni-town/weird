import { getSession } from '$lib/rauthy/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTheme, profileLinkById } from '$lib/leaf/profile';
import { parseThemeData } from '$lib/renderer';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ theme?: { page?: string; profile: string } }> => {
	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(403, 'Not logged in');
	const profileLink = await profileLinkById(sessionInfo.user_id);
	if (!profileLink) return error(404);
	const { data } = (await getTheme(profileLink)) || {};
	const theme = data ? parseThemeData(data) : undefined;

	return { theme };
};
