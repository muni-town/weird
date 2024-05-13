import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const headers = new Headers();
	const cookies = request.headers.get('Cookie');
	cookies ? headers.set('Cookie', cookies) : undefined;
	const resp = await fetch(env.RAUTHY_URL + '/auth/v1/version', { headers });
	const info = JSON.parse(await resp.text());

	return info;
};
