import { claimUsername, deleteUsername, listUsers } from '$lib/usernames';
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: ServerLoad = async ({}) => {
	return { users: await listUsers() };
};

export const actions = {
	claimUsername: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const rauthyId = formData.get('rauthyId')?.toString();
		const subspace = formData.get('subspace')?.toString();
		if (!(username && rauthyId && subspace)) return { error: 'You must fill in all fields' };

		try {
			await claimUsername(username, rauthyId, subspace);
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
			await deleteUsername(username);
		} catch (e) {
			return { error: `Error deleting username: ${e}` };
		}

		return { success: `Username ${username} deleted.` };
	}
} satisfies Actions;
