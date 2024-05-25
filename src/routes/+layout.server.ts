import { env } from '$env/dynamic/public';
import { checkResponse } from '$lib/utils';
import type { LayoutServerLoad } from './$types';
import type { SessionInfo, UserInfo } from '$lib/rauthy';

// TODO: Move this logic to a "SessionProvider" component.
export const load: LayoutServerLoad = async ({ fetch, request }) => {
	let sessionInfo: SessionInfo | undefined = undefined;
	let userInfo: UserInfo | undefined = undefined;

	try {
		const sessionInfoResp = await fetch('/auth/v1/oidc/sessioninfo', {
			headers: request.headers
		});
		await checkResponse(sessionInfoResp);
		sessionInfo = await sessionInfoResp.json();

		const userInfoResp = await fetch(`/auth/v1/users/${sessionInfo?.user_id}`, {
			headers: request.headers
		});
		await checkResponse(userInfoResp);
		userInfo = await userInfoResp.json();
	} catch (_) {}

	return { sessionInfo, userInfo };
};
