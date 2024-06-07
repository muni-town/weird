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
		let display_name = data.get('display_name');
		if (display_name === '') {
			display_name = null;
		}
		let avatar_seed = data.get('avatar_seed');
		if (avatar_seed == '') {
			avatar_seed = null;
		}
		let location = data.get('location');
		if (location == '') {
			location = null;
		}
		let contact_info = data.get('contact_info');
		if (contact_info == '') {
			contact_info = null;
		}
		const tags = data.getAll('tags');
		let work_capacity = data.get('work_capacity');
		if (work_capacity == '') {
			work_capacity = null;
		}
		let work_compensation = data.get('work_compensation');
		if (work_compensation == '') {
			work_compensation = null;
		}

		const json = JSON.stringify({
			username,
			display_name,
			avatar_seed,
			location,
			contact_info,
			tags,
			work_capacity,
			work_compensation
		});

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
