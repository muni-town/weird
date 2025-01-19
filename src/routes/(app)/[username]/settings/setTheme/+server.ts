import { profileLinkById, setTheme } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { createThemeData } from '$lib/renderer';
import { type RequestHandler, json } from '@sveltejs/kit';
import { z } from 'zod';

const Req = z.object({
	templates: z.optional(
		z.object({
			profile: z.string(),
			page: z.string()
		})
	)
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
		parsed.data.templates
			? { data: createThemeData(parsed.data.templates.profile, parsed.data.templates.page) }
			: undefined
	);

	return new Response();
};
