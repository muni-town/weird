import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		const body = JSON.stringify({
			username: `${pubenv.PUBLIC_INSTANCE_NAME} ( ${(data.get('email') || 'Anonymous').toString()} )`,
			content: (data.get('content') || 'empty message')?.toString()
		});
		await fetch(env.FEEDBACK_WEBHOOK, {
			method: 'post',
			headers: [['content-type', 'application/json']],
			body
		});

		return redirect(302, '/feedback/confirmation');
	}
} satisfies Actions;
