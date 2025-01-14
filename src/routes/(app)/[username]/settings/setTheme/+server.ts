import { profileLinkById, setTheme } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { type RequestHandler, json } from '@sveltejs/kit';
import { z } from 'zod';

const Req = z.object({
	template: z.optional(z.string())
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
	const profileLink = await profileLinkById(sessionInfo.user_id);
	await setTheme(
		profileLink,
		parsed.data.template ? { data: new TextEncoder().encode(parsed.data.template) } : undefined
	);

	return new Response();
};
