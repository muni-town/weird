import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../../../(app)/auth/v1/account/proxy+page.server';
import { checkResponse } from '$lib/utils';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params,
	cookies
}): Promise<{
	profile: Profile | { error: string };
	params: typeof params;
	token: string | undefined;
	is_author: boolean;
}> => {
	const token = cookies.get('token');
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
	}

	if (!loggedIn) {
		profile.contact_info = undefined;
	}

	const is_author = await backendFetch(fetch, `/token/${userInfo?.id}/verify`, {
		method: 'POST',
		body: JSON.stringify({ token }),
		headers: [['content-type', 'application/json']]
	});

	return { profile, params: { ...params }, token, is_author: is_author.ok };
};
