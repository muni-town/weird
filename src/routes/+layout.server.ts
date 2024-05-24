import { checkResponse } from '$lib/utils';
import type { LayoutServerLoad } from './$types';
import type { SessionInfo, UserInfo } from '$lib/rauthy';

// TODO: Move this logic to a "SessionProvider" component.
export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	let sessionInfo: SessionInfo | undefined = undefined;
	let userInfo: UserInfo | undefined = undefined;

	const rauthySession = cookies.get('RauthySession');

	try {
		const sessionInfoResp = await fetch('/auth/v1/oidc/sessioninfo', {
			headers: [['Cookie', `RauthySession=${rauthySession}`]]
		});
		await checkResponse(sessionInfoResp);
		sessionInfo = await sessionInfoResp.json();

		const userInfoResp = await fetch(`/auth/v1/users/${sessionInfo?.user_id}`, {
			headers: [['Cookie', `RauthySession=${rauthySession}`]]
		});
		await checkResponse(userInfoResp);
		userInfo = await userInfoResp.json();
	} catch (_) {}

	return { sessionInfo, userInfo };
};
