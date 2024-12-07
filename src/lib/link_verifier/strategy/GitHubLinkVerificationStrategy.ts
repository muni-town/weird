import { LinkVerificationStrategy } from './LinkVerificationStrategy';

export class GitHubLinkVerificationStrategy extends LinkVerificationStrategy {
	constructor(dom: Window) {
		super('GitHubLinkVerificationStrategy', dom);
	}

	async verify(userProfileLinks: string[]): Promise<boolean> {
		const document = this.dom.document;
		const nodes = Array.from(document.querySelectorAll('a[rel="nofollow me"]'));
		const elements = nodes.filter((node) => !!node.getAttribute('href'));

		if (!elements.length) {
			return false;
		}

		return userProfileLinks.some((link) => {
			return !!elements.find((el) => {
				const href = el.getAttribute('href');

				if (href) {
					return href.startsWith(link);
				}

				return false;
			});
		});
	}
}
