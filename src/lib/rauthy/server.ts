import { env } from '$env/dynamic/private';

export const RAUTHY_URL = env.RAUTHY_URL;

// List of rauthy endpoints.
const endpoints = {
	pow: RAUTHY_URL + '/auth/v1/pow',
	register: RAUTHY_URL + '/auth/v1/users/register'
};
// const USERATTRIBUTES_APK_KEY = env.RAUTHY_USERATTRIBUTES_API_KEY;

export async function get_pow_challenge(): Promise<string> {
	const challengeResp = await fetch(endpoints.pow, { method: 'post' });
	if (!challengeResp.ok) {
		throw challengeResp;
	}
	const challenge = await challengeResp.text();
	return challenge;
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
