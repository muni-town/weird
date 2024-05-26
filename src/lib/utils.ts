import type { SessionInfo, UserInfo } from './rauthy';

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
