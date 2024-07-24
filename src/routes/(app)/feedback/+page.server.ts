import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
// import { backendFetch } from '$lib/backend';
import { checkResponse } from '$lib/utils';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		const pow = data.get('pow');
		try {
			await checkResponse(
				await backendFetch(fetch, '/pow', {
					method: 'put',
					body: JSON.stringify({ pow }),
					headers: [['content-type', 'application/json']]
				})
			);
			const body = JSON.stringify({
				username: `${pubenv.PUBLIC_INSTANCE_NAME} ( ${(data.get('email') || 'Anonymous').toString()} )`,
				content: (data.get('content') || 'empty message')?.toString()
			});
			await fetch(env.FEEDBACK_WEBHOOK, {
				method: 'post',
				headers: [['content-type', 'application/json']],
				body
			});
		} catch (e) {
			return error(500, `Error submitting feedback: ${JSON.stringify(e)}`);
		}

		return redirect(302, '/feedback/confirmation');
	}
} satisfies Actions;
