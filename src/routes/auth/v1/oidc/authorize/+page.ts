import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
	const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
	const init = await initResp.json();

	return { csrfToken: init.csrf_token, url: url.toString() };
};
