import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils/http';
import type { PageServerLoad } from './$types';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({ fetch }): Promise<{ providers: Provider[] }> => {
	let providers: Provider[] = [];
	try {
		const providersResp = await fetch('/auth/v1/providers/minimal');
		await checkResponse(providersResp);
		providers = await providersResp.json();
	} catch (e) {
		console.error('Error getting providers:', e);
	}

	return { providers };
};
