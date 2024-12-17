import { parseHTML } from 'linkedom';
import { GitHubLinkVerificationStrategy } from './strategy/GitHubLinkVerificationStrategy';

import type { WebLink } from '$lib/leaf/profile';
import type { LinkVerificationStrategyFactory } from './strategy/LinkVerificationStrategy';
import { env } from '$env/dynamic/public';

export const VERIFIABLE_ORIGIN_STRATEGY: Record<string, LinkVerificationStrategyFactory> = {
	'https://github.com': (dom) => new GitHubLinkVerificationStrategy(dom)
};

export const VERIFIABLE_ORIGINS: string[] = Object.keys(VERIFIABLE_ORIGIN_STRATEGY);

export function verifiableOriginFilter(webLink: WebLink): boolean {
	return (
		VERIFIABLE_ORIGINS.findIndex((url) => new URL(webLink.url).origin === new URL(url).origin) !==
		-1
	);
}

export type LinkArray = { label?: string; url: string }[];

export class LinkVerifier {
	private webLinks: LinkArray;
	private userName: string;

	constructor(links: LinkArray, userName: string) {
		this.webLinks = links.filter(verifiableOriginFilter);
		this.userName = userName;
	}

	private static async fetchHtml(webLink: WebLink): Promise<Window> {
		const res = await fetch(webLink.url);

		if (res.status === 200) {
			const resText = await res.text();
			return parseHTML(resText);
		}

		throw new Error(
			`Failed to fetch "${webLink.url}", expected a 200 HTTP Response, got "${res.status}" instead.`
		);
	}

	get links(): WebLink[] {
		return [...this.webLinks];
	}

	async verify(): Promise<WebLink[]> {
		const verifiedLinks: WebLink[] = [];

		for (const webLink of this.webLinks) {
			const origin = new URL(webLink.url).origin;
			const linkVerificationStrategyFactory = VERIFIABLE_ORIGIN_STRATEGY[
				origin
			] as LinkVerificationStrategyFactory | null;

			if (typeof linkVerificationStrategyFactory === 'function') {
				const dom = await LinkVerifier.fetchHtml(webLink);
				const strategy = linkVerificationStrategyFactory(dom);
				const isVerified = await strategy.verify(this.userProfileLink());

				if (isVerified) {
					verifiedLinks.push(webLink);
				}

				continue;
			}

			// This should not happen, but if we got here somehow its likely we got a false positive
			// in the origins map.
			throw new Error(`The WebLink with URL "${webLink.url}" is not supported by any strategy.`);
		}

		return verifiedLinks;
	}

	private userProfileLink(): string {
		return `${env.PUBLIC_URL}/${this.userName}`;
	}
}
