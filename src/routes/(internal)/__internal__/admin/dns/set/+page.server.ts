import { getSession } from '$lib/rauthy/server';
import { error, type Actions } from '@sveltejs/kit';

import '$lib/dns/dns-control';
import { dnsManager, Packet } from '$lib/dns/dns-control';

export const actions = {
	default: async ({ fetch, request }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo?.roles?.includes('admin')) {
			return error(403, 'Access denied');
		}
		let formData;
		let domain: string;
		let valuesStr: string;
		let kind: string;
		try {
			formData = await request.formData();
			domain = formData.get('domain')?.toString() || '';
			valuesStr = formData.get('values')?.toString() || '';
			kind = formData.get('kind')?.toString() || 'TXT';
		} catch (e) {
			return { error: JSON.stringify(e) };
		}

		try {
			const values = valuesStr.split(',');
			let recordKind;
			switch (kind) {
				case 'TXT':
					recordKind = Packet.TYPE.TXT;
					break;
				case 'A':
					recordKind = Packet.TYPE.A;
					break;
				default:
					throw 'Invalid DNS type';
			}
			await dnsManager.setRecords(domain, recordKind, values);
		} catch (e) {
			return { error: JSON.stringify(e) };
		}
	}
} satisfies Actions;
