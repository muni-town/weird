import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { ensureUsernameMatchesSessionUserId } from '../utils';

export const load: PageServerLoad = async ({ fetch, params, request, url }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(302, `/login?to=${url}`);
	const resp = await ensureUsernameMatchesSessionUserId(params.username!, sessionInfo.user_id);
	if (resp) return resp;
};
