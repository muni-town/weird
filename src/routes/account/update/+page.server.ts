import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils';
import { fail, type Actions, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			return fail(400, { message: 'Must be logged in to set username' });
		}
		const data = await request.formData();
		let username = data.get('username');
		if (username === '') {
			username = null;
		}

		const json = JSON.stringify({ username });

		try {
			const resp = await backendFetch(fetch, `/profile/${userInfo.id}`, {
				method: 'post',
				headers: [['content-type', 'application/json']],
				body: json
			});
			await checkResponse(resp);
		} catch (e) {
			return fail(400, { message: `Error updating profile: ${e}` });
		}

		return redirect(301, '/auth/v1/account');
	}
} satisfies Actions;
