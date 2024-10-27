import { dev } from '$app/environment';
import { startDevDnsServer, Packet } from './dev-dns-server';

export type DnsRecordType = (typeof Packet.TYPE)[keyof typeof Packet.TYPE];
export { Packet };

export type DnsRecord = {
	host: string;
	type: DnsRecordType;
	value: string;
};

export interface DnsManagementAPI {
	setRecords(host: string, type: DnsRecordType, values: string[]): Promise<void>;
	deleteRecords(ops: { host: string; type: DnsRecordType }): Promise<void>;
}

export const devDnsStoreKey = (host: string, type: DnsRecordType): string => `${type}--${host}`;

function createDevDnsManager() {
	const store = startDevDnsServer();

	return {
		async setRecords(host: string, type: DnsRecordType, values: string[]) {
			const key = devDnsStoreKey(host, type);
			const records = [];
			for (const value of values) {
				records.push({
					class: Packet.CLASS.IN,
					name: host,
					type,
					address: value,
					ttl: 300
				});
			}
			await store.set(key, records);
		},
		async deleteRecords({ host, type }: { host: string; type: DnsRecordType }) {
			const key = devDnsStoreKey(host, type);
			await store.delete(key);
		}
	};
}

function createProdDnsManager() {
	return {
		async setRecords(_host: string, _type: DnsRecordType, _values: string[]) {
			throw 'TODO: implement prod dns manager';
		},
		async deleteRecords(_: { host: string; type: DnsRecordType }) {
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
