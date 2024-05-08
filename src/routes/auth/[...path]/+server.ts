import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const trailingSlash = 'ignore';

export const fallback: RequestHandler = async ({ request }) => {
	const { pathname, search } = new URL(request.url);
	const url = new URL('.' + pathname, env.RAUTHY_URL);
	url.search = search;

	const headers = new Headers(request.headers);
	headers.set('Host', url.hostname);

	const resp = await fetch(url, {
		method: request.method,
		headers,
		body: request.body ? await request.blob() : undefined,
		redirect: 'manual'
	});

	// It is necessary to delete the content encoding and length headers from the
	// original response because `fetch` has already decoded the br/gz compression
	// and the content length has now changed.
	const respHeaders = new Headers(resp.headers);
	respHeaders.delete('content-encoding');
	respHeaders.delete('content-length');

	return new Response(resp.body, {
		headers: respHeaders,
		status: resp.status,
		statusText: resp.statusText
	});
};
