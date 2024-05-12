import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const headers = new Headers({
		'Set-Cookie': cookies.toString()
	});
	const resp = await fetch(env.RAUTHY_URL + '/auth/v1/auth_check', { headers });
	const key_info = JSON.parse(await resp.text());

	return { key_info };
};
