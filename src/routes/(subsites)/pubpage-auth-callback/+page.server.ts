import { env } from '$env/dynamic/public';
import { checkResponse } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({ url, cookies }): Promise<void> => {
	const cks = decodeURIComponent(url.searchParams.get('cookies')!);
	const token = decodeURIComponent(url.searchParams.get('token')!);
	cookies.set('token', token, { path: '/' });
	for (const i in JSON.parse(cks)) {
		const { name, value } = JSON.parse(cks)[i];
		cookies.set(name, value, { path: '/' });
	}
	return redirect(307, `http://${env.PUBLIC_DOMAIN}/auth/v1/account`);
};
