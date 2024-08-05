import { backendFetch } from '$lib/backend.js';

export const actions = {
	default: async ({ fetch, request }) => {
		const data = await request.formData();
		const discord_id = data.get('discord_id');
		const urls = data.getAll('urls');
		const tag = data.get('tag');
		const fetch_profile = await backendFetch(fetch, `/profile/by-token/${discord_id}`, {
			method: 'GET',
			headers: [
				['accept', 'application/json'],
				['x-token-auth', data.get('api_key')!]
			]
		});
		let profile = await fetch_profile.json();
		if (!profile.lists) {
			profile.lists = {};
		}
		if (!profile.lists[tag!]) {
			profile.lists[tag!] = [];
		}
		for (const url in urls) {
			const label = url.split('/').pop();
			profile.lists[tag!].push({ url, label });
		}

		const fetch_update = await backendFetch(fetch, `/profile/by-token/${discord_id}`, {
			method: 'POST',
			headers: [
				['content-type', 'application/json'],
				['x-token-auth', data.get('api_key')!]
			],
			body: JSON.stringify(profile)
		});
		if (!fetch_update.ok) {
			return fetch_update;
		}

		return 'Okay';
	}
};
