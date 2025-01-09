import { usernames } from '$lib/usernames/index';
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';
import { marked } from 'marked';
import { emailer } from '$lib/email';
import { listRauthyUsers } from '$lib/rauthy/server';
import { env } from '$env/dynamic/private';

export const load: ServerLoad = async ({}) => {};

export const actions = {
	sendEmail: async ({ request, fetch }) => {
		const formData = await request.formData();
		const rawRecipient = formData.get('recipient')?.toString();
		const subject = formData.get('subject')?.toString();
		const bodyMarkdown = formData.get('bodyMarkdown')?.toString();
		if (!(subject && bodyMarkdown && rawRecipient)) return { error: 'You must fill in all fields' };

		const bodyHtml = await marked.parse(bodyMarkdown);

		let recipients = [];
		if (rawRecipient == '___everyone___') {
			// TODO: should we send to all rauthy-registered users, not just ones that have registered a username?
			//
			// We need to double-check the consequences of this, though, because a user that deletes their
			// profile probably doesn't want to be emailed by us, and if they delete their profile, their
			// rauthy account still exists.
			for (const user of await listRauthyUsers(fetch, request)) {
				const username = await usernames.getByRauthyId(user.id);
				if (username) {
					recipients.push(user.email);
				}
			}
		} else {
			recipients.push(rawRecipient);
		}

		for (const recipient of recipients) {
			await emailer.sendMail({
				to: recipient,
				from: env.SMTP_FROM,
				subject,
				text: bodyMarkdown,
				html: bodyHtml
			});
		}

		return { success: `Email sent!` };
	}
} satisfies Actions;
