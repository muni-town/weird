import { env } from '$env/dynamic/public';

export interface Username {
	name: string;
	domain?: string;
}

/**
 * Parse a usernme in the format `user@domain` or `user`, and return the name and the domain.
 */
export function parseUsername(username: string): Username {
	if (username.includes('@')) {
		const split = username.split('@');
		return {
			name: split[0],
			domain: split[1]
		};
	} else {
		return {
			name: username
		};
	}
}

export class FullUsername {
	name: string;
	domain: string;
	constructor(name: string, domain: string) {
		this.name = name;
		this.domain = domain;
	}
	toString(): string {
		return `${this.name}@${this.domain}`;
	}
	toObject(): { name: string; domain: string } {
		return {
			name: this.name,
			domain: this.domain
		};
	}
}

export function fullyQualifiedUsername(username: string): FullUsername {
	const parsed = parseUsername(username);
	return new FullUsername(parsed.name, parsed.domain || env.PUBLIC_DOMAIN);
}
