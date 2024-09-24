import type { Actions, PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils';
import { env } from '$env/dynamic/public';
import { createChallenge } from '$lib/dns-challenge';
import { getProfileById, setCustomDomain, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ profile?: Profile; serverIp?: string; dnsChallenge?: string }> => {
	let serverIp;
	let dnsChallenge;

	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		dnsChallenge = await createChallenge(userInfo.id);
		const profile = await getProfileById(userInfo.id);
		if (!profile) return error(404, 'Profile not found');

		return { profile, serverIp, dnsChallenge };
	} else {
		return { serverIp, dnsChallenge };
	}
};

export const actions = {
	default: async ({ request, fetch }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			throw 'User not logged in';
		}
		const formData = await request.formData();
		const customDomain = formData.get('custom_domain');
		let resp;

		if (customDomain && customDomain != '') {
			const dnsChallenge = await createChallenge(userInfo.id);
			try {
				resp = await fetch(`http://${customDomain}/__internal__/dns-challenge/${dnsChallenge}/${userInfo?.id}`);
			} catch (_) {}
			if (resp?.status != 200) {
				throw 'Error validating DNS challenge';
			}

			await setCustomDomain(userInfo.id, customDomain.toString());
		} else {
			await setCustomDomain(userInfo.id, undefined);
		}
	}
} satisfies Actions;
