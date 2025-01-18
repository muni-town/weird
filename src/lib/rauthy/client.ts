import { checkResponse } from '$lib/utils/http';

/** Get a proof-of-work challenge from the auth server. */
export async function get_pow_challenge(): Promise<string> {
	return await (await fetch('/auth/weird/pow')).text();
}

export interface Provider {
	id: string;
	name: string;
}

export async function getProviders(fetch: typeof globalThis.fetch): Promise<Provider[]> {
	let providers: Provider[] = [];
	const providersResp = await fetch('/auth/v1/providers/minimal');
	await checkResponse(providersResp);
	providers = await providersResp.json();
	return providers;
}
