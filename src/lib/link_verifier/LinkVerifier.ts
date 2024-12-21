import { parseHTML } from 'linkedom';

import type { LinkVerificationStrategyFactory } from './strategy/LinkVerificationStrategy';
import { DefaultLinkVerificationStrategy } from './strategy/DefaultLinkVerificationStrategy';

export const VERIFIABLE_ORIGIN_STRATEGY: Record<string, LinkVerificationStrategyFactory> = {
	// Put custom link verifiers for specific domains here once we have them.
	// 'https://github.com': GitHubLinkVerificationStrategy
};

export const VERIFIABLE_ORIGINS: string[] = Object.keys(VERIFIABLE_ORIGIN_STRATEGY);

export class LinkVerifier {
	private webLinks: string[];
	private userName: string;

	constructor(links: string[], username: string) {
		this.webLinks = links;
		this.userName = username;
	}

	private static async fetchHtml(webLink: string): Promise<Window> {
		const res = await fetch(webLink);

		if (res.status === 200) {
			const resText = await res.text();
			return parseHTML(resText);
		}

		throw new Error(
			`Failed to fetch "${webLink}", expected a 200 HTTP Response, got "${res.status}" instead.`
		);
	}

	get links(): string[] {
		return [...this.webLinks];
	}

	async verify(): Promise<string[]> {
		const verifiedLinks: string[] = [];

		for (const webLink of this.webLinks) {
			const origin = new URL(webLink).origin;
			const linkVerificationStrategyFactory =
				(VERIFIABLE_ORIGIN_STRATEGY[origin] as LinkVerificationStrategyFactory) ||
				DefaultLinkVerificationStrategy;

			let dom;
			try {
				dom = await LinkVerifier.fetchHtml(webLink);
			} catch (_) {
				// If it can't be fetched, it just isn't verified.
				continue;
			}
			const strategy = new linkVerificationStrategyFactory(dom);
			const isVerified = await strategy.verify(this.userName);

			if (isVerified) {
				verifiedLinks.push(webLink);
			}

			continue;
		}

		return verifiedLinks;
	}
}
