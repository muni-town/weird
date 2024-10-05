import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	try {
		return await fetch(
			`http://${params.domain}/__internal__/dns-challenge/${params.dnsChallenge}/${params.userId}`
		);
	} catch (e) {
		console.error(e);
		return error(500, `Error validating domain: ${params.domain}\nError: ${e}`);
	}
};
