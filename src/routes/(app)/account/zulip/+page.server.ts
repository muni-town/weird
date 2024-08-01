import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const domain = formData.get('domain') as string;
		const email = formData.get('email') as string;
		const apiKey = formData.get('apiKey') as string;
		if (!domain || !email || !apiKey) {
			return {
				error: 'All fields are required!'
			};
		}

		throw redirect(302, `/account/zulip/profile?domain=${domain}&email=${email}&apiKey=${apiKey}`);
	}
};
