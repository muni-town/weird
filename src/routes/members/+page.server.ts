import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../auth/v1/account/proxy+page.server';

export const load: PageServerLoad = async ({
	fetch,
	request,
	url
}): Promise<{ profiles: Profile[]; search?: string }> => {
	let { userInfo } = await getSession(fetch, request);
	let loggedIn = !!userInfo;
	const resp = await backendFetch(fetch, `/profiles`);
	let profiles: Profile[] = await resp.json();

	if (!loggedIn) {
		profiles.forEach((x) => {
			x.contact_info = undefined;
		});
	}

	return { profiles, search: url.searchParams.get('q') || undefined };
};
