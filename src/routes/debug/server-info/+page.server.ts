import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const resp = await fetch(env.BACKEND_URL + '/server-info', {
		headers: [
			['Authorization', `Bearer ${env.BACKEND_SECRET}`],
			['Cookie', request.headers.get('Cookie')!]
		]
	});
	const info = await resp.json();

	return { info };
};
