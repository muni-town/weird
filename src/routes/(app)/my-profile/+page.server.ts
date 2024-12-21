import { getSession } from '$lib/rauthy/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { usernames } from '$lib/usernames/index';

export const load: PageServerLoad = async ({ fetch, request }): Promise<void> => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(303, '/login');
	const username = await usernames.getByRauthyId(sessionInfo.user_id);
	if (!username) return redirect(303, '/claim-handle');
	return redirect(303, `/${usernames.shortNameOrDomain(username)}`);
};
