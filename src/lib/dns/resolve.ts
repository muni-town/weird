import { base32Decode, type SubspaceId } from 'leaf-proto';
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

export async function resolveAuthoritative(hostname: string, type: 'TXT' | 'A'): Promise<string[]>;
export async function resolveAuthoritative(hostname: string, type: 'A'): Promise<string[]>;
export async function resolveAuthoritative(hostname: string, type: 'CNAME'): Promise<string[]>;
export async function resolveAuthoritative(hostname: string, type = 'A'): Promise<ResolveResponse> {
	const resolver = new dns.promises.Resolver();
	resolver.setServers(dns.getServers());
	return await resolver.resolve(hostname, type);

	// TODO: actually resolve authoritatively.
	//
	// The reason we are not doing this now is because Node.js does not allow
	// us to make a non-recursive DNS query for the namerser records.
	// This means that some DNS servers, when queried for nameservers, if it finds a CNAME
	// record, will return the nameserver for the domain pointed to by the CNAME record.
	//
	// Because the Node.js query result doesn't include the hostnames of the returned records,
	// we also can't _tell_ that the NS record is not actually for the host that we are actually
	// querying.
	//
	// Our fix will have to involve using a package like dns2 to make a complete query to the DNS
	// server that either doesn't send the recursion flag in the DNS query, or returns the complete
	// DNS answers so that we can filter based on the ones that have the hostname we are querying for.

	// const ns: string[] = await new Promise(async (res, rej) => {
	// 	// Climb the subdomains up to find the nameserver responsible for it.
	// 	let h = hostname;
	// 	while (true) {
	// 		try {
	// 			const records = await new Promise((res, rej) =>
	// 				resolver.resolveNs(h, (err, addrs) => {
	// 					err ? rej(err) : res(addrs);
	// 				})
	// 			);
	// 			return res(records as string[]);
	// 		} catch (e) {
	// 			if (h.split('.').length <= 2) {
	// 				return rej(e);
	// 			} else {
	// 				h = h.split('.').slice(1).join('.');
	// 			}
	// 		}
	// 	}
	// });
	// const nsIps: string[][] = await Promise.all(
	// 	ns.map(async (host) => {
	// 		if (isIP(host) || isIP(host.split(':')[0])) {
	// 			return [host];
	// 		} else {
	// 			return await new Promise((res, rej) => {
	// 				resolver.resolve(host.split(':')[0], (err, addrs) => (err ? rej(err) : res(addrs)));
	// 			});
	// 		}
	// 	})
	// );
	// resolver.setServers(nsIps.flat());
	// const result: ResolveResponse = await new Promise((res, rej) =>
	// 	resolver.resolve(hostname, type, (err, addrs) => {
	// 		console.log(err);
	// 		err ? rej(err) : res(addrs);
	// 	})
	// );
	// return result;
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
