import { LINKTREE_PROFILE_PATH } from '$lib/constants.js';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username') as string;
		if (!username) {
			return {
				error: 'linktree username  must not be empty'
			};
		}

		throw redirect(302, `${LINKTREE_PROFILE_PATH}?username=${username}`);
	}
};
