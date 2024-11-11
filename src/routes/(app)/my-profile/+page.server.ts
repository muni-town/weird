import { getSession } from '$lib/rauthy/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { userNameByRauthyId as usernameByRauthyId } from '$lib/usernames';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ fetch, request }): Promise<void> => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(303, '/login');
	const username = await usernameByRauthyId(sessionInfo.user_id);
	if (!username) return redirect(303, '/claim-username');
	return redirect(303, `/${username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0]}`);
};
