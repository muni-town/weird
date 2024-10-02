import type { Actions, PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { checkResponse } from '$lib/utils/http';
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

	let { sessionInfo } = await getSession(fetch, request);
	if (sessionInfo) {
		dnsChallenge = await createChallenge(sessionInfo.user_id);
		const profile = await getProfileById(sessionInfo.user_id);
		if (!profile) return error(404, 'Profile not found');

		return { profile, serverIp, dnsChallenge };
	} else {
		return { serverIp, dnsChallenge };
	}
};

export const actions = {
	default: async ({ request, fetch }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) {
			throw 'User not logged in';
		}
		const formData = await request.formData();
		const customDomain = formData.get('custom_domain');
		let resp;

		if (customDomain && customDomain != '') {
			const dnsChallenge = await createChallenge(sessionInfo.user_id);
			try {
				resp = await fetch(
					`http://${customDomain}/__internal__/dns-challenge/${dnsChallenge}/${sessionInfo?.id}`
				);
			} catch (_) {}
			if (resp?.status != 200) {
				throw 'Error validating DNS challenge';
			}

			await setCustomDomain(sessionInfo.user_id, customDomain.toString());
		} else {
			await setCustomDomain(sessionInfo.user_id, undefined);
		}
	}
} satisfies Actions;
