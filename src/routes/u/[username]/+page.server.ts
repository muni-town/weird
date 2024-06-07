import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../../auth/v1/account/proxy+page.server';

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
