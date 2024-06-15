import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { env } from '$env/dynamic/private';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		await fetch(env.FEEDBACK_WEBHOOK, {
			method: 'post',
			body: JSON.stringify({
				username: data.get('email') || 'Anonymous',
				content: data.get('content')
			})
		});

		return redirect(302, '/feedback/confirmation');
	}
} satisfies Actions;
