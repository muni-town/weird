import { env } from '$env/dynamic/public';
import type { SessionInfo, UserInfo } from './rauthy';

export interface CheckResponseError {
	status: number;
	statusText: string;
	data: string;
}

/** Throw an exception if the response is not OK. */
export async function checkResponse(response: Response | Promise<Response>): Promise<Response> {
	const resp = response instanceof Promise ? await response : response;
	if (!resp.ok) {
		throw {
			status: resp.status,
			statusText: resp.statusText,
			data: await resp.text()
		};
	}
	return resp;
}

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
