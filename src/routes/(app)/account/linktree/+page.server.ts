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

		throw redirect(302, `/account/linktree/profile?username=${username}`);
	}
};
