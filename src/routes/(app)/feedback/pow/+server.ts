import { backendFetch } from '$lib/backend';
import { checkResponse } from '$lib/utils';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
	const powChallengeResp = await backendFetch(fetch, '/pow');
	checkResponse(powChallengeResp);
	const challenge = await powChallengeResp.text();
	return new Response(challenge);
};
