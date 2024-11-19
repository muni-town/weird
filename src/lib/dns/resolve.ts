import { base32Decode, type SubspaceId } from 'leaf-proto';
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

export async function resolveAuthoritative(hostname: string, type: 'TXT' | 'A'): Promise<string[]>;
export async function resolveAuthoritative(hostname: string, type: 'A'): Promise<string[]>;
export async function resolveAuthoritative(hostname: string, type: 'CNAME'): Promise<string[]>;
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
			console.log(err);
			err ? rej(err) : res(addrs);
		})
	);
	return result;
}

export type ResolvedUser = {
	subspace: SubspaceId;
};
export async function resolveUserSubspaceFromDNS(
	domain: string
): Promise<ResolvedUser | undefined> {
	const txtRecords = await resolveAuthoritative('_weird.' + domain, 'TXT');
	// TODO: Resolve Iroh ticket / NodeID along with subspace
	for (const record of txtRecords) {
		const [key, value] = record.split('=');

		if (key == 'subspace') {
			let subspace;
			try {
				subspace = base32Decode(value);
			} catch (_) {}
			if (subspace) {
				return { subspace };
			}
		}
	}
}
