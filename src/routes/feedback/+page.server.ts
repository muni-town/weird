import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		await fetch(env.FEEDBACK_WEBHOOK, {
			method: 'post',
			body: JSON.stringify({
				username: `${pubenv.PUBLIC_INSTANCE_NAME} ( ${(data.get('email') || 'Anonymous').toString()} )`,
				content: (data.get('content') || 'empty message')?.toString()
			})
		});

		return redirect(302, '/feedback/confirmation');
	}
} satisfies Actions;
