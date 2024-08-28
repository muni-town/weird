import type { PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils';
import { getProfileById, type Profile } from '$lib/leaf/profile';

export interface Provider {
	id: string;
	name: string;
}

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ profile?: Profile; providers: Provider[] }> => {
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

	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		return { profile: await getProfileById(userInfo.id), providers };
	} else {
		return { providers };
	}
};
