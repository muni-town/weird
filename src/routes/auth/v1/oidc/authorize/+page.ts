import type { PageLoad } from './$types';
// import * as rauthy from '$lib/rauthy/server';
// import cookie from 'cookie';

export const load: PageLoad = async ({ url, fetch }) => {
	const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
	const init = await initResp.json();
	// const rauthySession = initResp.headers
	// 	.getSetCookie()
	// 	.map((x) => cookie.parse(x)['RauthySession'])
	// 	.filter((x) => !!x)[0];
	// cookies.set('RauthySession', rauthySession, { httpOnly: true, path: '/', maxAge: 14400 });

	return { csrfToken: init.csrf_token, url: url.toString() };
};

