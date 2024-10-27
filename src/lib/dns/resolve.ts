import dns, {
	type AnyRecord,
	type MxRecord,
	type NaptrRecord,
	type SoaRecord,
	type SrvRecord
} from 'node:dns';

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
	resolver.setServers(ns);
	const result: ResolveResponse = await new Promise((res, rej) =>
		resolver.resolve(hostname, type, (err, addrs) => {
			err ? rej(err) : res(addrs);
		})
	);
	return result;
}
