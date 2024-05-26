import { backendFetch } from '$lib/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const resp = await backendFetch(fetch, '/server-info', {
		headers: request.headers
	});
	const info = await resp.json();

	return { info };
};
