import { dev } from '$app/environment';
import { startDevDnsServer, Packet } from './dev-dns-server';

export type DnsRecordType = (typeof Packet.TYPE)[keyof typeof Packet.TYPE];

export type DnsRecord = {
	host: string;
	type: DnsRecordType;
	value: string;
};

export interface DnsManagementAPI {
	createRecord(record: DnsRecord): Promise<void>;
	deleteRecords(ops: { host: string; type: DnsRecordType }): Promise<void>;
}

function createDevDnsManager() {
	const store = startDevDnsServer();

	const dnsKey = (host: string, type: DnsRecordType): string => `${type}--${host}`;

	return {
		async createRecord({ host, type, value }: DnsRecord) {
			const key = dnsKey(host, type);
			await store.set(key, [
				{
					class: Packet.CLASS.IN,
					name: host,
					type,
					address: value,
					ttl: 300
				},
				...((await store.get(key)) || [])
			]);
		},
		async deleteRecords({ host, type }: { host: string; type: DnsRecordType }) {
			const key = dnsKey(host, type);
			await store.delete(key);
		}
	};
}

function createProdDnsManager() {
	return {
		async createRecord({ host, type, value }: DnsRecord) {
			throw 'TODO: implement prod dns manager';
		},
		async deleteRecords({ host, type }: { host: string; type: DnsRecordType }) {
			throw 'TODO: implement prod dns manager';
		}
	};
}

function createDnsManager() {
	if (dev) {
		return createDevDnsManager();
	} else {
		return createProdDnsManager();
	}
}

export const dnsManager: DnsManagementAPI = createDnsManager();
