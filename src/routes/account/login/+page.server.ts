import type { Actions, PageServerLoad } from './$types';

// import { mailer } from '$lib/email';

export const load: PageServerLoad = async ({ url }) => {
	return {
		hasReset: !!url.searchParams.get('hasReset')
	};
};

export const actions = {
	default: async () => {
		// const data = await request.formData();
		// const options = {
		// 	from: 'you@example.com',
		// 	to: data.get('email')!,
		// 	subject: 'hello world',
		// 	html: 'hello world'
		// };
		// mailer.sendMail(options);
	}
} satisfies Actions;
