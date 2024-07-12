import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	return await fetch(
		`http://${params.domain}/dns-challenge/${params.dnsChallenge}/${params.user_id}`
	);
};
