import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../auth/v1/account/proxy+page.server';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ profiles: Profile[] }> => {
	let { userInfo } = await getSession(fetch, request);
	let loggedIn = !!userInfo;
	const resp = await backendFetch(fetch, `/profiles`);
	let profiles: Profile[] = await resp.json();

	if (!loggedIn) {
		profiles.forEach((x) => {
			x.contact_info = undefined;
		});
	}

	return { profiles };
};
