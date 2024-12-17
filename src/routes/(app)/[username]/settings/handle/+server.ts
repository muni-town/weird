import { billing } from '$lib/billing';
import { getSession } from '$lib/rauthy/server';
import { usernames } from '$lib/usernames';
import { type RequestHandler, json } from '@sveltejs/kit';
import { z } from 'zod';

const Req = z.union([
	z.object({
		username: z.string().regex(usernames.validUsernameRegex)
	}),

	z.object({
		domain: z.string().regex(usernames.validDomainRegex)
	})
]);
type Req = z.infer<typeof Req>;

export const POST: RequestHandler = async ({ request, fetch }) => {
	const data = await request.json();
	const parsed = Req.safeParse(data);
	if (!parsed.data) {
		return json({ error: `Invalid body ${parsed.error}` }, { status: 400 });
	}

	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) {
		return new Response(null, { status: 403 });
	}
	const oldUsername = await usernames.getByRauthyId(sessionInfo.user_id);

	const subscriptionInfo = await billing.getSubscriptionInfo(sessionInfo.user_id);

	if (!subscriptionInfo.benefits.has('custom_domain') && 'domain' in parsed.data) {
		return json({ error: 'Cannot set username to custom domain without a subscription.' });
	} else if (
		!subscriptionInfo.benefits.has('non_numbered_username') &&
		'username' in parsed.data &&
		!usernames.validUnsubscribedUsernameRegex.test(parsed.data.username)
	) {
		return json({
			error: 'Cannot claim username without a 4 digit suffix without a subscription'
		});
	}

	try {
		await usernames.claim(parsed.data, sessionInfo.user_id);
		if (oldUsername) {
			await usernames.unset(oldUsername);
		}
		return json(parsed.data);
	} catch (e) {
		return json({ error: `${e}` });
	}
};
