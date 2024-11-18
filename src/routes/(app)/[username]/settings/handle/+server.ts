import { getSession } from '$lib/rauthy/server';
import {
	claimUsername,
	unsetUsername,
	userNameByRauthyId,
	validUsernameRegex
} from '$lib/usernames';
import { type RequestHandler, json } from '@sveltejs/kit';
import { z } from 'zod';

const Req = z.object({
	username: z.string().regex(validUsernameRegex)
});
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
	const oldUsername = await userNameByRauthyId(sessionInfo.user_id);
	try {
		await claimUsername({ username: parsed.data.username }, sessionInfo.user_id);
		console.log('unset', oldUsername);
		if (oldUsername) {
			await unsetUsername(oldUsername);
		}

		return json({ username: parsed.data.username });
	} catch (e) {
		return json({ error: `${e}` });
	}
};
