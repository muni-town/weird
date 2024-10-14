declare module 'namedrop-js' {
	export const SCOPE_HOSTS: string;
	export const SCOPE_MAIL: string;
	export const SCOPE_ACME: string;
	export const SCOPE_ATPROTO_HANDLE: string;
	export const validScopes: string[];

	export class Client {
		constructor(params: { token: string; permission: string; domain: string; host: string });

		get domain(): string;
		get host(): string;
		get token(): string;
		get permissions(): string;

		async getRecords(opt?: {
			domain?: string;
			host?: string;
			records: [];
		}): Promise<NamedropRecord[]>;
		async createRecords(opt: {
			domain: string;
			host: string;
			records: NamedropRecord[];
		}): Promise<void>;
		async setRecords(opt: {
			domain: string;
			host: string;
			records: NamedropRecord[];
		}): Promise<void>;
		async deleteRecords(opt: {
			domain: string;
			host: string;
			records: NamedropRecord[];
		}): Promise<void>;
	}

	export function setApiUri(uri: string): void;
	export async function checkAuthFlow(): Promise<Client>;
	export async function startAuthFlow(req: { scopes: string[] }): Promise<void>;

	export type NamedropScope =
		| 'namedrop-hosts'
		| 'namedrop-mail'
		| 'namedrop-acme'
		| 'namedrop-atproto-handle';

	export type NamedropRecord = {
		type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'ANAME';
		value?: string;
		domain?: string;
		/**
		 * May contain the `{{host}}` placeholder to substitute for the domain host.
		 *
		 * For example you can set a subdomain host with:
		 *
		 *     example.{{host}}
		 */
		host?: string;
		ttl?: number;
		priority?: number;
	};
}
