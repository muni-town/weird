import { env } from '$env/dynamic/private';
import { checkResponse } from '$lib/utils';
import type { RequestHandler } from '@sveltejs/kit';
import cookie from 'cookie';
import type { SessionInfo, UserInfo } from '.';

export const RAUTHY_URL = env.RAUTHY_URL;
export const PWD_RESET_COOKIE = 'rauthy-pwd-reset';

export const proxy_to_rauthy: RequestHandler = async ({ request, fetch }) => {
	const { pathname, search } = new URL(request.url);
	const url = new URL('.' + pathname, env.RAUTHY_URL);
	url.search = search;

	const headers = new Headers(request.headers);
	headers.set('Host', url.hostname);

	const resp = await fetch(url, {
		method: request.method,
		headers,
		body: request.body ? await request.blob() : undefined,
		redirect: 'manual'
	});

	// It is necessary to delete the content encoding and length headers from the
	// original response because `fetch` has already decoded the br/gz compression
	// and the content length has now changed.
	const respHeaders = new Headers(resp.headers);
	respHeaders.delete('content-encoding');
	respHeaders.delete('content-length');

	return new Response(resp.body, {
		headers: respHeaders,
		status: resp.status,
		statusText: resp.statusText
	});
};

// List of rauthy endpoints.
const endpoints = {
	pow: RAUTHY_URL + '/auth/v1/pow',
	register: RAUTHY_URL + '/auth/v1/users/register',
	users: RAUTHY_URL + '/auth/v1/users'
};

export async function get_pow_challenge(): Promise<string> {
	const challengeResp = await fetch(endpoints.pow, { method: 'post' });
	if (!challengeResp.ok) {
		throw challengeResp;
	}
	const challenge = await challengeResp.text();
	return challenge;
}

export async function init_reset(opts: { user: string; token: string }): Promise<Response> {
	return await checkResponse(fetch(`${endpoints.users}/${opts.user}/reset/${opts.token}`));
}

export async function reset(opts: {
	user: string;
	password: string;
	token: string;
	cookie: string;
	csrfToken: string;
}) {
	const resp = await fetch(`${endpoints.users}/${opts.user}/reset`, {
		method: 'put',
		headers: {
			Cookie: cookie.serialize('rauthy-pwd-reset', opts.cookie),
			'pwd-csrf-token': opts.csrfToken
		},
		body: JSON.stringify({
			magic_link_id: opts.token,
			password: opts.password
		})
	});
	return await checkResponse(resp);
}

export async function get_user(opts: { user: string }): Promise<{ [key: string]: string }> {
	const resp = await fetch(endpoints.users + '/' + opts.user, {
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	});
	if (!resp.ok) {
		throw {
			message: 'Error getting user info',
			statusText: resp.statusText,
			status: resp.status,
			data: await resp.json()
		};
	}
	const data = await resp.json();
	return data;
}

export async function register_user(opts: {
	email: string;
	family_name: string;
	given_name: string;
	redirect_uri: string;
	pow: string;
}) {
	const body = JSON.stringify(opts);

	const registerResp = await fetch(endpoints.register, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body
	});

	if (!registerResp.ok) {
		throw await registerResp.text();
	}
}

// export async function reset_init(_opts: { user: string, token: string }) {
// }

export async function getSession(
	fetch: typeof window.fetch,
	request: Request
): Promise<{ sessionInfo?: SessionInfo; userInfo?: UserInfo }> {
	let sessionInfo: SessionInfo | undefined = undefined;
	let userInfo: UserInfo | undefined = undefined;

	const headers = new Headers(request.headers);
	headers.delete('content-length');
	const toDelete = [];
	for (const header of headers) {
		if (header[0].toLowerCase().startsWith('sec-')) {
			toDelete.push(header[0]);
		}
	}
	for (const name of toDelete) {
		headers.delete(name);
	}

	try {
		const sessionInfoResp = await fetch('/auth/v1/oidc/sessioninfo', {
			headers
		});
		await checkResponse(sessionInfoResp);
		sessionInfo = await sessionInfoResp.json();

		const userInfoResp = await fetch(`/auth/v1/users/${sessionInfo?.user_id}`, {
			headers
		});
		await checkResponse(userInfoResp);
		userInfo = await userInfoResp.json();
	} catch (_) {}

	return { sessionInfo, userInfo };
}
