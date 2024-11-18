import type { PageServerLoad } from './$types';
import { getProfileByDomain, getProfileByUsername, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({
	params
}): Promise<{
	profile: Profile;
	params: typeof params;
}> => {
	let profile = await getProfileByUsername(params.username);
	if (!profile) {
		return error(404, 'Profile not found.');
	}

	return { profile, params: { ...params } };
};
