import { getSession } from '$lib/rauthy/server';
import { redirect, type ServerLoad, fail } from '@sveltejs/kit';
import { setDiscordUserRauthyId } from '$lib/leaf/discord.js';
import { getDiscordIdForLoginLink } from '$lib/discord_bot/index.js';

export const load: ServerLoad = async ({ params, fetch, request }) => {
	let { userInfo } = await getSession(fetch, request);
	if (!userInfo) {
		// TODO: hook up the login form so that it redirects back to this discord
		// authentication once you are logged in.
		return redirect(307, '/auth/v1/account');
	}
	return { ...params };
};

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			return fail(403, { error: 'You are not logged in' });
		}
		const data = await request.formData();
		const linkId = data.get('link_id')?.toString();
		if (!linkId) return fail(400, { error: 'Missing link ID' });
		const discordId = await getDiscordIdForLoginLink(linkId);
		if (!discordId) return fail(400, { error: 'The login link has expired.' });

		await setDiscordUserRauthyId(discordId, userInfo.id);

		return { success: true };
	}
};
