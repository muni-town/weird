import { validateChallenge } from '$lib/dns-challenge';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	return new Response(null, {
		status: (await validateChallenge(params.challengeId!, params.userId!)) ? 200 : 400
	});
};
