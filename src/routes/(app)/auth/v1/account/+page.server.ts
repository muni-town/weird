import type { PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils';

export interface Provider {
	id: string;
	name: string;
}

export interface Profile {
	username?: string;
	custom_domain?: string;
	display_name?: string;
	location?: string;
	tags: string[];
	contact_info?: string;
	work_capacity?: WorkCapacity;
	work_compensation?: WorkCompensation;
	bio: string;
	links?: { label?: string; url: string }[];
	mastodon_username?: string;
	mastodon_server?: string;
	mastodon_access_token?: string;
}
export type WorkCapacity = 'full_time' | 'part_time';
export type WorkCompensation = 'paid' | 'volunteer';

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
		const resp = await backendFetch(fetch, `/profile/${userInfo.id}`);
		const profile: Profile = await resp.json();

		return { profile, providers };
	} else {
		return { providers };
	}
};
