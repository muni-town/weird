import { env } from '$env/dynamic/private';
import { pow_work_wasm } from '$lib/spow/spow-wasm';

export const RAUTHY_URL = env.RAUTHY_URL;

// List of rauthy endpoints.
const endpoints = {
	pow: RAUTHY_URL + '/auth/v1/pow',
	register: RAUTHY_URL + '/auth/v1/users/register'
};
// const USERATTRIBUTES_APK_KEY = env.RAUTHY_USERATTRIBUTES_API_KEY;

export async function register_user(opts: {
	email: string;
	family_name: string;
	given_name: string;
	redirect_uri: string;
}) {
	console.log('register user', opts.email);

	// Get a proof-of-work challenge
	const challengeResp = await fetch(endpoints.pow, { method: 'post' });
	if (!challengeResp.ok) {
		throw challengeResp;
	}
	const challenge = await challengeResp.text();
	const pow = await pow_work_wasm(challenge);

	const body = JSON.stringify({
		...opts,
		pow
	});

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

	const registerRespText = await registerResp.text();
	console.log(registerRespText);
}
