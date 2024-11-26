import { JSDOM } from 'jsdom';

import { LinkVerificationStrategy } from './LinkVerificationStrategy';

export class GitHubLinkVerificationStrategy extends LinkVerificationStrategy {
	constructor(dom: JSDOM) {
		super('GitHubLinkVerificationStrategy', dom);
	}

	async verify(userProfileLink: string): Promise<boolean> {
		const document = this.dom.window.document;
		const nodes = Array.from(document.querySelectorAll('a[rel="nofollow me"]'));
		const element = nodes.find((node) => node.getAttribute('href')?.startsWith(userProfileLink));

		if (!element) {
			return false;
		}

		const href = element.getAttribute('href');

		if (!href) {
			return false;
		}

		return href.startsWith(userProfileLink);
	}
}
