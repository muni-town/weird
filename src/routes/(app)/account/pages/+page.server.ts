import type { PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { profileLinkById, type Profile, getProfile, listChildren } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ profile?: Profile; pages: string[] }> => {
	let { sessionInfo } = await getSession(fetch, request);
	if (sessionInfo) {
		const profileLink = profileLinkById(sessionInfo.user_id);
		const profile = await getProfile(profileLink);
		if (!profile) return error(404, 'Profile not found');

		const pages = await listChildren(profileLink);

		return { profile, pages };
	} else {
		return { pages: [] };
	}
};
