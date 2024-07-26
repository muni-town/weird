import { getContext, setContext } from 'svelte';

export interface SessionInfo {
	id: string;
	user_id: string;
	roles: string;
	exp: string;
	timeout: string;
}

export interface UserInfo {
	email: string;
	email_verified: boolean;
	id: string;
	roles: string[];
	auth_provider_id: string;
	account_type:
		| 'new'
		| 'password'
		| 'passkey'
		| 'federated'
		| 'federated_passkey'
		| 'federated_password';
	enabled: boolean;
	groups: string[];
	mastodon_server: string;
	mastodon_username: string;
	mastodon_access_token: string;
	subsite_theme?: string;
}

export const setUserInfo = (info?: UserInfo) => setContext('userInfo', info);
export const getUserInfo = () => getContext<UserInfo | undefined>('userInfo');
export const setSessionInfo = (info?: SessionInfo) => setContext('sessionInfo', info);
export const getSessionInfo = () => getContext<UserInfo | undefined>('sessionInfo');
