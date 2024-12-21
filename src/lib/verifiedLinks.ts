import { BorshSchema, Component, type ExactLink } from 'leaf-proto';
import { instance_link, leafClient } from './leaf';
import { CommonMark } from 'leaf-proto/components';
import { LinkVerifier } from './link_verifier/LinkVerifier';

const verifiedLinksPrefix = 'verified_links';

export class VerifiedLinks extends Component {
	value: string[];
	constructor(links: (string | URL)[] = []) {
		super();
		this.value = links.map((x) => new URL(x).href);
	}
	static componentName(): string {
		return 'VerifiedLinks';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Vec(BorshSchema.String);
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A list of links that have been verified by the Weird server\
as pointing at a user's profile.`)
		];
	}
}

function entityLinkForUserVerifiedLinks(username: string): ExactLink {
	return instance_link(verifiedLinksPrefix, username);
}

export const verifiedLinks = {
	/** Gets the list of URLs that have been verified for the given user ID. */
	async get(username: string): Promise<string[]> {
		const entityLink = entityLinkForUserVerifiedLinks(username);
		const verifiedLinksEnt = await leafClient.get_components(entityLink, VerifiedLinks);
		return verifiedLinksEnt?.get(VerifiedLinks)?.value || [];
	},

	/** Sets the list of URLs that have been verified for the given user ID. */
	async set(username: string, links: (string | URL)[]) {
		const linksComponent = new VerifiedLinks(links);
		const entityLink = entityLinkForUserVerifiedLinks(username);
		await leafClient.update_components(entityLink, [linksComponent]);
	},

	/** Verifies and updates the verified links for a user, given the links from their profile. */
	async verify(username: string, links: string[]) {
		const linkVerifier = new LinkVerifier(links, username);
		const verifiedLinks = await linkVerifier.verify();
		this.set(username, verifiedLinks);
	}
};
