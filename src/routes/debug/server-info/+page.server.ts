import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const headers = request.headers;
	headers.set('Authorization', `Bearer ${env.BACKEND_SECRET}`);
	const resp = await fetch(env.BACKEND_URL + '/server-info', {
		headers
	});
	const info = await resp.json();

	return { info };
};
