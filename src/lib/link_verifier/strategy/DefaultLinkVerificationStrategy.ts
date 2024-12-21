import { env } from '$env/dynamic/public';
import { usernames } from '$lib/usernames/client';
import { LinkVerificationStrategy } from './LinkVerificationStrategy';

export class DefaultLinkVerificationStrategy extends LinkVerificationStrategy {
	constructor(dom: Window) {
		super('DefaultLinkVerificationStrategy', dom);
	}

	async verify(userDomain: string): Promise<boolean> {
		const document = this.dom.document;
		const nodes = Array.from(document.querySelectorAll('a[rel~="me"],link[rel~="me"]'));
		for (const node of nodes) {
			const href = node.getAttribute('href');
			try {
				if (href) {
					const url = new URL(href);
					if (
						url.host == userDomain ||
						url.href == env.PUBLIC_URL + '/' + userDomain ||
						url.href == env.PUBLIC_URL + '/' + usernames.shortNameOrDomain(userDomain)
					)
						return true;
				}
			} catch (_) {} // Just in case URL is invalid
		}

		return false;
	}
}
