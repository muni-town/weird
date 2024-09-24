export interface SessionInfo {
	id: string;
	user_id: string;
	roles?: string;
	groups?: string;
	exp: string;
	timeout: string;
	state?: string;
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
}
