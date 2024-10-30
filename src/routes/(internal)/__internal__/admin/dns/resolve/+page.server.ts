import { getSession } from '$lib/rauthy/server';
import { error, type Actions } from '@sveltejs/kit';

import { resolveAuthoritative } from '$lib/dns/resolve';

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
		try {
			const resp = await resolveAuthoritative(domain, kind);
			return { data: { query, resp } };
		} catch (e) {
			return { error: JSON.stringify(e) };
		}
	}
} satisfies Actions;
