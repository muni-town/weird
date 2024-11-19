import { getSession } from '$lib/rauthy/server';
import {
	claimUsername,
	unsetUsername,
	userNameByRauthyId,
	validUsernameRegex,
	validDomainRegex
} from '$lib/usernames';
import { type RequestHandler, json } from '@sveltejs/kit';
import { z } from 'zod';

const Req = z.union([
	z.object({
		username: z.string().regex(validUsernameRegex)
	}),

	z.object({
		domain: z.string().regex(validDomainRegex)
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
	const oldUsername = await userNameByRauthyId(sessionInfo.user_id);

	try {
		await claimUsername(parsed.data, sessionInfo.user_id);
		if (oldUsername) {
			await unsetUsername(oldUsername);
		}
		return json(parsed.data);
	} catch (e) {
		return json({ error: `${e}` });
	}
};
