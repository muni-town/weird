import dns, {
	type AnyRecord,
	type MxRecord,
	type NaptrRecord,
	type SoaRecord,
	type SrvRecord
} from 'node:dns';
import { isIP } from 'node:net';

export type ResolveResponse =
	| string[]
	| MxRecord[]
	| NaptrRecord[]
	| SoaRecord
	| SrvRecord[]
	| string[][]
	| AnyRecord[];

export async function resolveAuthoritative(hostname: string, type = 'A'): Promise<ResolveResponse> {
	const resolver = new dns.Resolver();
	resolver.setServers(dns.getServers());
	const ns: string[] = await new Promise((res, rej) =>
		resolver.resolveNs(hostname, (err, addrs) => {
			err ? rej(err) : res(addrs);
		})
	);
	const nsIps: string[][] = await Promise.all(
		ns.map(async (host) => {
			if (isIP(host) || isIP(host.split(':')[0])) {
				return [host];
			} else {
				return await new Promise((res, rej) => {
					resolver.resolve(host.split(':')[0], (err, addrs) => (err ? rej(err) : res(addrs)));
				});
			}
		})
	);
	resolver.setServers(nsIps.flat());
	const result: ResolveResponse = await new Promise((res, rej) =>
		resolver.resolve(hostname, type, (err, addrs) => {
			err ? rej(err) : res(addrs);
		})
	);
	return result;
}
