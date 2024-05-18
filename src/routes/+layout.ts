import { browser } from '$app/environment';
import { checkResponse } from '$lib/utils';
import { setContext } from 'svelte';
import type { LayoutLoad } from './$types';
import type { SessionInfo, UserInfo } from '$lib/rauthy';

export const load: LayoutLoad = async ({ fetch }) => {
	if (!browser) {
		return;
	}
	let sessionInfo: SessionInfo | undefined = undefined;
	let userInfo: UserInfo | undefined = undefined;

	try {
		const sessionInfoResp = await fetch('/auth/v1/oidc/sessioninfo');
		await checkResponse(sessionInfoResp);
		sessionInfo = await sessionInfoResp.json();

		const userInfoResp = await fetch(`/auth/v1/users/${sessionInfo?.user_id}`);
		await checkResponse(userInfoResp);
		userInfo = await userInfoResp.json();
	} catch (_) {}

	return { sessionInfo, userInfo };
};
