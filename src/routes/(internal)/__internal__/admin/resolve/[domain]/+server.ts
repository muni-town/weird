import { getSession } from '$lib/rauthy/server';
import { error, type RequestHandler } from '@sveltejs/kit';
import dns from 'node:dns';

import '$lib/dns/dns-control';

export const GET: RequestHandler = async ({ params, fetch, request }) => {
	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo?.roles?.includes('admin')) {
		return error(403, 'Access denied');
	}
	return new Promise((resolve) => {
		dns.resolve(params.domain!, (result, records) => {
			resolve(new Response(JSON.stringify({ result, records }, null, '  ')));
		});
	});
};
