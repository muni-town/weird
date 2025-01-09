import { base32Decode, type SubspaceId } from 'leaf-proto';
import nodeDns from 'node:dns';
import { isIP } from 'node:net';
import dns2 from 'dns2';

export async function resolveAuthoritative(
	hostname: string,
	type: dns2.PacketQuestion
): Promise<dns2.DnsAnswer[]> {
	console.log('resolving', hostname);
	let resolver = new dns2({
		nameServers: nodeDns.getServers(),
		recursive: false
	});
	const ns: string[] = await new Promise(async (res, rej) => {
		// Climb the subdomains up to find the nameserver responsible for it.
		let h = hostname;
		while (true) {
			try {
				const records = await resolver.resolve(h, 'NS');
				return res(records.answers.filter((x) => x.name == h).map((x) => x.address!));
			} catch (e) {
				if (h.split('.').length <= 2) {
					return rej(e);
				} else {
					h = h.split('.').slice(1).join('.');
				}
			}
		}
	});
	const nsIps: string[][] = await Promise.all(
		ns.map(async (host) => {
			if (isIP(host) || isIP(host.split(':')[0])) {
				return [host];
			} else {
				return (await resolver.resolve(host.split(':')[0])).answers.map((x) => x.address!);
			}
		})
	);
	resolver = new dns2({
		nameServers: nsIps.flat()
	});
	const result = (await resolver.resolve(hostname, type)).answers;
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
	for (const record of txtRecords.map((x) => x.data || '')) {
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
