import { getSession } from '$lib/rauthy/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProfileById } from '$lib/leaf/profile';

export const load: PageServerLoad = async ({ fetch, request }): Promise<void> => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(303, '/login');
	const profile = await getProfileById(sessionInfo.user_id);
	if (!profile?.username) return redirect(303, '/claim-username');

	return redirect(303, `/${profile.username.split('@')[0]}`);
};
