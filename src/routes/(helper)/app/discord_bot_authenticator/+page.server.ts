import { env } from '$env/dynamic/private';
import { getSession } from '$lib/rauthy/server';
import { redirect, fail } from '@sveltejs/kit';
import { leafClient } from '$lib/leaf/index.js';

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			return redirect(307, '/auth/v1/account');
		}
		const data = await request.formData();
		const discord_id = data.get('discord_id') as string;
		const discord_tokens = JSON.parse(
			(await leafClient.get_local_secret('discord_tokens')) ?? '{}'
		);
		discord_tokens[userInfo.id] = discord_id;
		leafClient.set_local_secret('discord_tokens', JSON.stringify(discord_tokens));
        return "Okay";
	}
};
