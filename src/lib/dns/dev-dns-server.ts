import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import dns2 from 'dns2';
import dns from 'dns';
import { devDnsStoreKey } from './dns-control';

export const { Packet } = dns2;

const DEV_DNS_PORT = 7753;

export function startDevDnsServer(): Keyv<dns2.DnsAnswer[]> {
	const dnsRecordStore = new Keyv<dns2.DnsAnswer[]>({
		store: new KeyvRedis('redis://localhost:7634') as any,
		namespace: 'weird-dns'
	});

	const defaultDnsServer = dns.getServers()[0];
	const dns2client = (dns2 as any).UDPClient({ dns: defaultDnsServer });

	const server = dns2.createServer({
		udp: true,
		handle: async (request, send, _rinfo) => {
			const list = [];
			for await (const item of dnsRecordStore.iterator()) {
				list.push(JSON.stringify(item, null, '  '));
			}

			const response = Packet.createResponseFromRequest(request);
			const [question] = request.questions;
			const { name, type } = question as {
				name: string;
				type: (typeof Packet)['TYPE'][keyof (typeof Packet)['TYPE']];
			};

			let typeStr: string;
			switch (type) {
				case Packet.TYPE.NS:
					// We're the "authoritative" nameserver for everything during development.
					response.answers.push(
						...dns.getServers().map((x) => ({
							name,
							type: Packet.TYPE.NS,
							class: Packet.CLASS.IN,
							ttl: 300,
							ns: x
						}))
					);
					send(response);
					return;
				case Packet.TYPE.A:
					typeStr = 'A';
					break;
				case Packet.TYPE.TXT:
					typeStr = 'TXT';
					break;
				default:
					typeStr = 'A';
					break;
			}

			const answers =
				(await dnsRecordStore.get(devDnsStoreKey(name, type))) ||
				(await dns2client(name, typeStr))?.answers ||
				[];
			for (const item of answers) {
				response.answers.push(item);
			}
			send(response);
		}
	});

	server.listen({
		udp: {
			address: '0.0.0.0',
			port: DEV_DNS_PORT
		}
	});

	dns.setServers([`127.0.0.1:${DEV_DNS_PORT}`]);

	return dnsRecordStore;
}
