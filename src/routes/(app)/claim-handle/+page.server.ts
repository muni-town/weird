import { getSession } from '$lib/rauthy/server';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { usernames } from '$lib/usernames/index';
import { getAvatar, profileLinkById, setAvatar } from '$lib/leaf/profile.js';
import { RawImage } from 'leaf-proto/components.js';

import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';
import { billing } from '$lib/billing.js';
import { validUnsubscribedUsernameRegex } from '$lib/usernames/client.js';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(303, '/login');
	const username = await usernames.getByRauthyId(sessionInfo.user_id);
	if (username) {
		return redirect(303, `/${username}`);
	} else {
		const subscriptionInfo = await billing.getSubscriptionInfo(sessionInfo.user_id);
		return { subscriptionInfo };
	}
};

export const actions = {
	claimHandle: async ({ fetch, request }) => {
		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return fail(403, { error: 'Not logged in' });

		const formData = await request.formData();
		const username = formData.get('username') as string;
		if (!username) return fail(400, { error: 'Username not provided ' });

		const subscriptionInfo = await billing.getSubscriptionInfo(sessionInfo.user_id);

		try {
			if (!subscriptionInfo.isSubscribed && !username.match(validUnsubscribedUsernameRegex)) {
				return fail(400, { error: '' });
			}

			await usernames.claim({ username }, sessionInfo.user_id);
			const profileLink = await profileLinkById(sessionInfo.user_id);
			const avatar = createAvatar(glass, { seed: sessionInfo.user_id, radius: 50 });
			if (!(await getAvatar(profileLink))) {
				setAvatar(
					profileLink,
					new RawImage('image/svg+xml', new TextEncoder().encode(avatar.toString()))
				);
			}
		} catch (error) {
			return fail(400, { error });
		}

		return redirect(303, '/my-profile');
	}
};