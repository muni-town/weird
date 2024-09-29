import { env } from '$env/dynamic/public';
import { getProfileById, setProfileById } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(303, '/login');
	const profile = await getProfileById(sessionInfo.user_id);
	if (profile?.username) return redirect(303, '/my-profile');
};

export const actions = {
	claimUsername: async ({ fetch, request }) => {
		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return fail(403, { error: 'Not logged in' });

		const formData = await request.formData();
		const username = formData.get('username') as string;
		if (!username) return fail(400, { error: 'Username not provided ' });

		try {
			const existingProfile = (await getProfileById(sessionInfo.user_id)) || {
				tags: [],
				links: []
			};
			existingProfile.username = `${username}@${env.PUBLIC_DOMAIN}`;
			await setProfileById(sessionInfo.user_id, existingProfile);
		} catch (error) {
			return fail(400, { error });
		}

		return redirect(303, '/my-profile');
	}
};
