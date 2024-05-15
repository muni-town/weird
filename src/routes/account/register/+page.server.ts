import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

import { register_user } from '$lib/rauthy/server';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const pow = data.get('pow');
		if (typeof email != 'string') {
			throw 'Email not set';
		}
		if (typeof pow != 'string') {
			throw 'Missing proof-of-work';
		}
		const home = new URL(request.url);
		home.pathname = '';
		const username = email.split('@')[0];
		try {
			await register_user({
				email,
				given_name: username,
				family_name: username,
				redirect_uri: home.toString(),
				pow
			});
		} catch (e) {
			console.error('Error registering user:', e);
			return fail(400, { message: 'Email address is invalid.' });
		}

		return redirect(303, '/account/register/confirmation');
	}
} satisfies Actions;
