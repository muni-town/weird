import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';

export interface Profile {
	username?: string;
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		const resp = await backendFetch(fetch, `/profile/${userInfo.id}`);
		const profile: Profile = await resp.json();

		return { profile };
	} else {
		return {};
	}
};
