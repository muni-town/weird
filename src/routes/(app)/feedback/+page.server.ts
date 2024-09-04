import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
import { Pow } from '$lib/pow';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		const pow = data.get('pow');
		if (!pow) return error(400, 'Missing proof-of-work');
		try {
			Pow.validate(pow.toString());
		} catch (_) {
			return error(400, 'Proof-of-Work bot detector validation failed');
		}
		try {
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
