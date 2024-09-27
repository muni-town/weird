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
		const initResp = await fetch(`/auth/v1/users/${user}/reset/${token}`, {});
		const initContent = await initResp.text();
		const csrfFind = 'name="rauthy-csrf-token" id="';
		let contentSplit = initContent.split(csrfFind)[1];
		csrfToken = contentSplit.split('"')[0];
		const passwordPolicyFind = 'name="rauthy-data" id="';
		contentSplit = initContent.split(passwordPolicyFind)[1];
		const arr = contentSplit
			.split('"')[0]
			.split(',')
			.map((x) => (x == '-1' ? undefined : Number.parseInt(x)));
		passwordPolicy = {
			length_min: arr[0],
			length_max: arr[1],
			include_lower_case: arr[2],
			include_upper_case: arr[3],
			include_digits: arr[4],
			include_special: arr[5],
			not_recently_used: arr[6]
		};
	} catch (e) {
		console.error('error loading reset page', e);
	}

	return { csrfToken, user, token, passwordPolicy };
};
