import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import dns2 from 'dns2';
import dns from 'dns';

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
			const response = Packet.createResponseFromRequest(request);
			const [question] = request.questions;
			const { name, type } = question as {
				name: string;
				type: (typeof Packet)['TYPE'][keyof (typeof Packet)['TYPE']];
			};

			let typeStr: string;
			switch (type) {
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
				(await dnsRecordStore.get(name)) || (await dns2client(name, typeStr))?.answers || [];
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
