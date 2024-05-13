import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

import { register_user } from '$lib/rauthy';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		if (typeof email != 'string') {
			throw 'Email not set';
		}
		const username = email.split('@')[0];
		try {
			await register_user({
				email,
				given_name: username,
				family_name: username,
				redirect_uri: request.url
			});
		} catch (e) {
			console.error('Error registering user:', e);
			return fail(400, { message: 'Invalid email address.'});
		}
	}
} satisfies Actions;
