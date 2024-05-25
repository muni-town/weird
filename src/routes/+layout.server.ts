import { env } from '$env/dynamic/public';
import { checkResponse } from '$lib/utils';
import type { LayoutServerLoad } from './$types';
import type { SessionInfo, UserInfo } from '$lib/rauthy';

// TODO: Move this logic to a "SessionProvider" component.
export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	let sessionInfo: SessionInfo | undefined = undefined;
	let userInfo: UserInfo | undefined = undefined;

	const rauthySession = cookies.get(`${env.PUBLIC_COOKIE_PREFIX}RauthySession`);
	console.log(rauthySession);

	try {
		const sessionInfoResp = await fetch('/auth/v1/oidc/sessioninfo', {
			headers: [['Cookie', `${env.PUBLIC_COOKIE_PREFIX}RauthySession=${rauthySession}`]]
		});
		console.log(sessionInfoResp);
		await checkResponse(sessionInfoResp);
		sessionInfo = await sessionInfoResp.json();
		console.log(sessionInfo);

		const userInfoResp = await fetch(`/auth/v1/users/${sessionInfo?.user_id}`, {
			headers: [['Cookie', `${env.PUBLIC_COOKIE_PREFIX}RauthySession=${rauthySession}`]]
		});
		console.log(userInfoResp)
		await checkResponse(userInfoResp);
		userInfo = await userInfoResp.json();
		console.log(userInfo);
	} catch (_) {}

	return { sessionInfo, userInfo };
};
