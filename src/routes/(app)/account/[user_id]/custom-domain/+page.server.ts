import type { Actions, PageServerLoad } from './$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../../../auth/v1/account/+page.server';
import { checkResponse } from '$lib/utils';
import { env } from '$env/dynamic/public';
import { createChallenge } from '$lib/dns-challenge';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{ profile?: Profile; serverIp?: string; dnsChallenge?: string }> => {
	let serverIp;
	let dnsChallenge;
	let resp;
	try {
		resp = await fetch(
			`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(env.PUBLIC_DOMAIN)}`,
			{
				headers: [['accept', 'application/dns-json']]
			}
		);
		await checkResponse(resp);
		const serverIpJson: { Answer?: { name: string; data: string }[] } = await resp.json();
		serverIp = serverIpJson.Answer?.[0].data;
	} catch (e) {
		console.error('Error fetching DNS over http', e);
	}

	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		dnsChallenge = await createChallenge(userInfo.id);
		resp = await backendFetch(fetch, `/profile/${userInfo.id}`);
		await checkResponse(resp);
		const profile: Profile = await resp.json();

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
			const publicUrl = new URL(env.PUBLIC_URL);

			const dnsChallenge = await createChallenge(userInfo.id);
			try {
				resp = await fetch(
					`${publicUrl.protocol}//${customDomain}/dns-challenge/${dnsChallenge}/${userInfo?.id}`
				);
			} catch (_) {}
			if (resp?.status != 200) {
				throw 'Error validating DNS challenge';
			}

			resp = await backendFetch(fetch, `/profile/domain/${userInfo.id}`, {
				method: 'post',
				headers: [['content-type', 'application/json']],
				body: JSON.stringify({
					domain: customDomain
				})
			});
			await checkResponse(resp);
		} else {
			resp = await backendFetch(fetch, `/profile/domain/${userInfo.id}`, {
				method: 'post',
				headers: [['content-type', 'application/json']],
				body: JSON.stringify({
					domain: null
				})
			});
			await checkResponse(resp);
		}
	}
} satisfies Actions;
