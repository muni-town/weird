import * as rauthy from '$lib/rauthy/server';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import cookie from 'cookie';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const { user, token } = params;
	let csrfToken;
	try {
		const initResp = await rauthy.init_reset({ user, token });
		const initContent = await initResp.text();
		const csrfFind = 'name="rauthy-csrf-token" id="';
		const contentSplit = initContent.split(csrfFind)[1];
		csrfToken = contentSplit.split('"')[0];
		for (const cookieSet of initResp.headers.getSetCookie()) {
			const cook = cookie.parse(cookieSet);
			if (cook[rauthy.PWD_RESET_COOKIE]) {
				cookies.set(rauthy.PWD_RESET_COOKIE, cook[rauthy.PWD_RESET_COOKIE], {
					secure: true,
					path: '/auth',
					maxAge: 512
				});
			}
		}
	} catch (e) {
		console.error('error loading reset page', e);
	}

	return { csrfToken };
};

export const actions = {
	default: async ({ request, cookies, params }) => {
		try {
			const data = await request.formData();
			const csrfToken = (data.get('csrfToken') || '').toString();
			const password = (data.get('password') || '').toString();
			await rauthy.reset({
				password,
				cookie: cookies.get(rauthy.PWD_RESET_COOKIE)!,
				token: params.token,
				user: params.user,
				csrfToken: csrfToken
			});
		} catch (e) {
			// TODO: handle error messages, especially regarding password policy, way better.
			console.log('error resetting password', e);
			return error(400, 'Error resetting password.');
		}

		return redirect(303, `/account/login?hasReset=true`);
	}
} satisfies Actions;
