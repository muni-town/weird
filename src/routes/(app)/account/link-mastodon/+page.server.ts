import type { PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils/http';
import { getProfileById, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({
	fetch,
	request,
	params,
	url
}): Promise<{
	profile: Profile;
	providers: Provider[];
	params: typeof params;
}> => {
	let providers: Provider[] = [];
	try {
		const providersResp = await fetch('/auth/v1/providers/minimal', {
			headers: [['x-forwarded-for', request.headers.get('x-forwarded-for')!]]
		});
		await checkResponse(providersResp);
		providers = await providersResp.json();
	} catch (e) {
		console.error('Error getting providers:', e);
	}

	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(403, 'Not logged in');

	const profile = await getProfileById(sessionInfo.user_id);
	if (!profile) return error(404, 'Profile not found');

	return { profile, providers, params };
};
