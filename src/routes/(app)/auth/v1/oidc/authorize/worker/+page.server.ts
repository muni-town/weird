import { env } from '$env/dynamic/public';
import { checkResponse } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/rauthy/server';
import type { PageServerLoad } from './$types';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({ url, cookies, fetch, request }): Promise<void> => {
	let { userInfo } = await getSession(fetch, request);
	if (!!userInfo) {
		return redirect(307, '/');
	}

	cookies.set('justLoggedIn', 'true', { path: '/' });
	cookies.set('csrfToken', decodeURIComponent(url.searchParams.get('csrf_token')!), { path: '/' });
	const redirect_uri = decodeURIComponent(url.searchParams.get('redirect_uri')!);
	return redirect(307, redirect_uri);
};
