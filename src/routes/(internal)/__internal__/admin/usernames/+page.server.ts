import { usernames } from '$lib/usernames/index';
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: ServerLoad = async ({}) => {
	const users = [];
	for await (const user of usernames.list()) users.push(user);
	return { users };
};

export const actions = {
	claimUsername: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const rauthyId = formData.get('rauthyId')?.toString();
		if (!(username && rauthyId)) return { error: 'You must fill in all fields' };

		try {
			await usernames.claim(username.includes('.') ? { domain: username } : { username }, rauthyId);
		} catch (e) {
			return { error: `Error claiming username: ${e}` };
		}

		return { success: `Username ${username} claimed.` };
	},
	deleteUsername: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		if (!username) return { error: 'You must fill in all fields' };

		try {
			await usernames.unset(username);
		} catch (e) {
			return { error: `Error deleting username: ${e}` };
		}

		return { success: `Username ${username} deleted.` };
	}
} satisfies Actions;
