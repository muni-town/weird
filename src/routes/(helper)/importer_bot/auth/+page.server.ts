import { env } from '$env/dynamic/private';
import { backendFetch } from '$lib/backend.js';
import { getSession } from '$lib/rauthy/server';
import { redirect, fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			return redirect(307, '/auth/v1/account');
		}
		const data = await request.formData();
		const discord_id = data.get('discord_id');
		const fetch_token = await backendFetch(fetch, `/token/${discord_id}/generate/${userInfo.id}`, {
			method: 'POST',
			headers: [['accept', 'application/json']]
		});
		const { token } = await fetch_token.json();
		return redirect(307, `${env.DISCORD_BOT_URL}/auth?discord_id=${discord_id}&token=${token}`);
	}
};
