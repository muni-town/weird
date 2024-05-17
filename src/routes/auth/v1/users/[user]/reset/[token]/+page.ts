import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const { user, token } = params;
	let csrfToken;
	try {
		const initResp = await fetch(`/auth/v1/users/${user}/reset/${token}`, {
			headers: {
				accept: 'application/json'
			}
		});
		const initContent = await initResp.json();
		csrfToken = initContent['csrf_token'];
	} catch (e) {
		console.error('error loading reset page', e);
	}

	return { csrfToken, user, token };
};
