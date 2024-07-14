import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { GH_ACCESS_TOKEN_URI, GH_SUCCESS_REDIRECT_PATH } from '$lib/constants.js';

const clientId = env.PUBLIC_GH_CLIENT_ID;
const clientSecret = privateEnv.GH_CLIENT_SECRET;
const redirectUri = env.PUBLIC_GH_REDIRECT_URI;

export async function load({ url, cookies }) {
	const requestToken = url.searchParams.get('code');
	if (!requestToken) return;

	const data = {
		client_id: clientId,
		client_secret: clientSecret,
		code: requestToken,
		redirect_uri: redirectUri
	};

	const accessTokenUri = `${GH_ACCESS_TOKEN_URI}?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${requestToken}`;

	const tokenResponse = await fetch(accessTokenUri, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		}
	});

	const tokenData = await tokenResponse.json();
	if (!tokenResponse.ok) {
		throw error(tokenResponse.status, {
			message: tokenData?.error
		});
	}

	const accessToken = tokenData.access_token;
	cookies.set('gh_access_token', accessToken, {
		path: '/',
		httpOnly: true,
		secure: privateEnv.NODE_ENV === 'production'
	});

	throw redirect(302, GH_SUCCESS_REDIRECT_PATH);
}
