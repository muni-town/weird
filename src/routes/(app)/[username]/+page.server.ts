import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../auth/v1/account/+page.server';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params
}): Promise<{ profile: Profile | { error: string }; params: typeof params }> => {
	let { userInfo } = await getSession(fetch, request);
	const loggedIn = !!userInfo;

	const resp = await backendFetch(fetch, `/profile/username/${params.username}`);
	const profile: Profile = await resp.json();

	if (!loggedIn) {
		profile.contact_info = undefined;
	}

	return { profile, params: { ...params } };
};
