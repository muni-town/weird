import type { Actions } from './$types';

import { mailer } from '$lib/email';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const options = {
			from: 'you@example.com',
			to: data.get('email')!,
			subject: 'hello world',
			html: 'hello world'
		};
		mailer.sendMail(options);
	}
} satisfies Actions;
