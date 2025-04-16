import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const { user, token } = params;
	let csrfToken: string | undefined;
	let passwordPolicy: {
		length_min?: number;
		length_max?: number;
		include_lower_case?: number;
		include_upper_case?: number;
		include_digits?: number;
		include_special?: number;
		not_recently_used?: number;
	} = {};
	try {
		const initResp = await fetch(`/auth/v1/users/${user}/reset/${token}`, {
			headers: [['accept', 'application/json']]
		});
		console.log('resp', initResp);
		const json = await initResp.json();
		csrfToken = json.csrf_token;
		passwordPolicy = json.password_policy;
	} catch (e) {
		console.error('error loading reset page', e);
	}

	return { csrfToken, user, token, passwordPolicy };
};
