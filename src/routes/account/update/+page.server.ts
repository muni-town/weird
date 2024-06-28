import { env } from '$env/dynamic/public';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import { checkResponse, type CheckResponseError } from '$lib/utils';
import { fail, type Actions, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			return fail(400, { error: 'Must be logged in to update profile.' });
		}
		const data = await request.formData();

		let username = data.get('username');
		if (username === '') {
			username = null;
		} else {
			username = `${username}@${env.PUBLIC_DOMAIN}`;
		}
		let display_name = data.get('display_name');
		if (display_name === '') {
			display_name = null;
		}
		let location = data.get('location');
		if (location == '') {
			location = null;
		}
		let contact_info = data.get('contact_info');
		if (contact_info == '') {
			contact_info = null;
		}
		let tagsInput = data.get('tags');
		let tags: string[] = [];
		if (tagsInput) {
			const trimmedInput = tagsInput.toString().trim();
			tags = trimmedInput
				.split(',')
				.map((x) => x.trim())
				.filter((x) => x.length > 0);
		}
		let linkUrlsInput = data.getAll('link-url');
		let linkLabelsInput = data.getAll('link-label');
		let links: { label: string; url: string }[] = [];
		for (let i = 0; i < linkUrlsInput.length; i++) {
			let url = linkUrlsInput[i].toString();
			if (url.length == 0) continue;
			let label = linkLabelsInput[i].toString();
			links.push({ url, label });
		}

		let work_capacity = data.get('work_capacity');
		if (work_capacity == '') {
			work_capacity = null;
		}
		let work_compensation = data.get('work_compensation');
		if (work_compensation == '') {
			work_compensation = null;
		}
		let bio = data.get('bio');
		if (bio == '') {
			bio = null;
		}

		const json = JSON.stringify({
			username,
			display_name,
			location,
			contact_info,
			tags,
			links,
			work_capacity,
			work_compensation,
			bio
		});

		try {
			const resp = await backendFetch(fetch, `/profile/${userInfo.id}`, {
				method: 'post',
				headers: [['content-type', 'application/json']],
				body: json
			});
			await checkResponse(resp);
		} catch (e) {
			console.error('Error updating profile:', e);
			const data = JSON.parse((e as CheckResponseError).data);
			return fail(400, { error: `Error updating profile: ${data.error}` });
		}

		try {
			const avatarData = data.get('avatar') as File;
			if (avatarData.name != '') {
				const body = new FormData();
				body.append('avatar', avatarData);
				const resp = await backendFetch(fetch, `/profile/${userInfo.id}/avatar`, {
					method: 'post',
					body
				});
				await checkResponse(resp);
			}
		} catch (e) {
			console.error('Error updating profile:', e);
			const data = JSON.parse((e as CheckResponseError).data);
			return fail(400, { error: `Error updating profile avatar: ${data.error}` });
		}

		return redirect(301, '/auth/v1/account');
	}
} satisfies Actions;
