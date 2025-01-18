import { getProviders, type Provider } from '$lib/rauthy/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }): Promise<{ providers: Provider[] }> => {
	let providers = await getProviders(fetch);

	return { providers };
};
