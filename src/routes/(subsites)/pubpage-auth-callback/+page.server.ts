import { env } from '$env/dynamic/public';
import { checkResponse } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({ url, cookies }): Promise<void> => {
	const token = decodeURIComponent(url.searchParams.get('token')!);
	cookies.set('token', token, { path: '/', secure: true });
	return redirect(307, `${env.PUBLIC_URL}/auth/v1/account`);
};
