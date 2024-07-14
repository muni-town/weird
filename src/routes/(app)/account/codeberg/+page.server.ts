import { CODEBERG_SUCCESS_REDIRECT_PATH, CODEBERG_USER_API } from '$lib/constants.js';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username') as string;
		if (!username) {
			return {
				error: 'Username must not be empty'
			};
		}
		const userResp = await fetch(`${CODEBERG_USER_API}/${username}`);
		if (!userResp.ok) {
			return {
				error: 'User not found'
			};
		}
		throw redirect(302, `${CODEBERG_SUCCESS_REDIRECT_PATH}?username=${username}`);
	}
};
