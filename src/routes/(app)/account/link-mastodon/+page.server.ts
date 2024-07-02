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
	display_name?: string;
	avatar_seed?: string;
	location?: string;
	tags: string[];
	contact_info?: string;
	work_capacity?: WorkCapacity;
	work_compensation?: WorkCompensation;
	bio: string;
	links?: { label?: string; url: string }[];
	mastodon_username?: string;
	mastodon_server?: string;
}
export type WorkCapacity = 'full_time' | 'part_time';
export type WorkCompensation = 'paid' | 'volunteer';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params,
	url
}): Promise<{
	profile?: Profile;
	providers: Provider[];
	params: typeof params;
	profiles: Profile[];
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

	let { userInfo } = await getSession(fetch, request);

	let loggedIn = !!userInfo;
	const resp = await backendFetch(fetch, `/profiles`);
	let profiles: Profile[] = await resp.json();

	if (!loggedIn) {
		profiles.forEach((x) => {
			x.contact_info = undefined;
		});
	}
	if (userInfo) {
		const resp = await backendFetch(fetch, `/profile/${userInfo.id}`);
		const profile: Profile = await resp.json();

		return { profile, providers, params, profiles };
	} else {
		return { providers, params, profiles };
	}
};
