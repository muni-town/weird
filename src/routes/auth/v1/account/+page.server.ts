import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';

export interface Profile {
	username?: string;
	display_name?: string;
	avatar_seed?: string;
	location?: string;
	contact_info?: string;
	work_capacity?: 'full_time' | 'part_time';
	work_compensation?: 'paid' | 'volunteer';
	tags: string[];
}

export const load: PageServerLoad = async ({ fetch, request }): Promise<{ profile?: Profile }> => {
	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		const resp = await backendFetch(fetch, `/profile/${userInfo.id}`);
		const profile: Profile = await resp.json();

		return { profile };
	} else {
		return {};
	}
};
