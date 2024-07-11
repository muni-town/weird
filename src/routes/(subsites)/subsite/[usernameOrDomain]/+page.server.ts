import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../../../(app)/auth/v1/account/proxy+page.server';
import { checkResponse } from '$lib/utils';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params
}): Promise<{ profile: Profile; params: typeof params }> => {
	let { userInfo } = await getSession(fetch, request);
	const loggedIn = !!userInfo;

	let resp = await backendFetch(fetch, `/profile/username/${params.usernameOrDomain}`);
	let profile: Profile | { error: string } = await resp.json();
	if ('error' in profile) {
		resp = await backendFetch(fetch, `/profile/domain/${params.usernameOrDomain}`);
		await checkResponse(resp);
		profile = await resp.json();
		if ('error' in profile) {
			throw 'User not found';
		}

		return { profile, params: { ...params } };
	} else {
		if (!loggedIn) {
			profile.contact_info = undefined;
		}

		return { profile, params: { ...params } };
	}
};
