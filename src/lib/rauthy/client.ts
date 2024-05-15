/** Get a proof-of-work challenge from the auth server. */
export async function get_pow_challenge(): Promise<string> {
	return await (await fetch('/auth/weird/pow')).text();
}
