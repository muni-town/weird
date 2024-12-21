/**
 * Username related functionality that can be imported safely into client side code ( but may be
 * useful even on the server ).
 */

import { env } from '$env/dynamic/public';

export const usernames = {
	validUsernameRegex: /^([a-z0-9][_-]?){3,32}$/,
	validUnsubscribedUsernameRegex: /^([a-z0-9][_-]?){3,32}[0-9]{4}$/,

	validDomainRegex: /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,12}(:[0-9]{1,5})?$/,

	genRandomUsernameSuffix() {
		return Math.floor(Math.random() * (9999 - 1000 + 1) + 1000).toString();
	},

	/** Get the list of configured public suffixes for this Weird server */
	publicSuffixes(): string[] {
		return env.PUBLIC_SUFFIXES.split(',');
	},

	/** Get the public suffix of the given user handle / domain. Returns `undefined` if it does not end
	 * in one of the Weird server's configured public suffixes. */
	publicSuffix(domain: string): string | undefined {
		return env.PUBLIC_SUFFIXES.split(',').find((x) => domain.endsWith(x));
	},

	/** Returns the domain split into the prefix and public suffix, or `undefined` if it didn't end
	 * with one of the Weird server's configured public suffixes. */
	splitPublicSuffix(domain: string): { prefix: string; suffix: string } | undefined {
		const suffix = this.publicSuffix(domain);
		if (!suffix) return;
		const prefix = domain.split(suffix)[0];
		return { prefix, suffix };
	},

	/** Get the default public suffix. */
	defaultSuffix(): string {
		return env.PUBLIC_SUFFIXES.split(',')[0];
	},

	/** Get the short name of the domain / handle, if it is suffixed by the default public suffix,
	 * otherwise return the full domain. */
	shortNameOrDomain(domain: string): string {
		return domain.split('.' + this.defaultSuffix())[0];
	},

	/** Takes an argument that is either a short name, or a full domain, and returns the short name
	 * extended with the default suffix, or the existing domain unchanged. */
	fullDomain(shortNameOrDomain: string): string {
		return shortNameOrDomain.includes('.')
			? shortNameOrDomain
			: `${shortNameOrDomain}.${this.defaultSuffix()}`;
	},

	/** Returns true if the given suffix is one of the Weird server's configured public suffixes. */
	isPublicSuffix(suffix: string): boolean {
		return env.PUBLIC_SUFFIXES.split(',').some((x) => x == suffix);
	}
};
