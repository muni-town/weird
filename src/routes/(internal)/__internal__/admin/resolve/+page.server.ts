import { getSession } from '$lib/rauthy/server';
import { error, type Actions } from '@sveltejs/kit';
import dns from 'node:dns';

import '$lib/dns/dns-control';

export const actions = {
	default: async ({ fetch, request }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo?.roles?.includes('admin')) {
			return error(403, 'Access denied');
		}
		let formData;
		let domain: string;
		let kind: string;
		try {
			formData = await request.formData();
			domain = formData.get('domain')?.toString() || '';
			kind = formData.get('kind')?.toString() || 'A';
		} catch (e) {
			return { error: JSON.stringify(e) };
		}
		const query = `${kind} ${domain}`;
		return await new Promise((ret) => {
			try {
				switch (kind) {
					case 'A':
						dns.resolve(domain, (result, records) => {
							ret({ data: { query, result: result?.toString(), records } });
						});
						break;
					case 'TXT':
						dns.resolve(domain, 'TXT', (result, records) => {
							ret({ data: { query, result: result?.toString(), records } });
						});
						break;
					default:
						ret({ data: null });
						break;
				}
			} catch (e) {
				ret({ error: JSON.stringify(e) });
			}
		});
	}
} satisfies Actions;
