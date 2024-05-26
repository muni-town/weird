import { env } from '$env/dynamic/private';

/** Fetch from the weird backend API. */
export async function backendFetch(
	fetch: typeof window.fetch,
	subpath: string,
	init?: RequestInit
): Promise<Response> {
	const headers = new Headers(init?.headers);
	headers.set('Authorization', `Bearer ${env.BACKEND_SECRET}`);
	return await fetch(`${env.BACKEND_URL}${subpath}`, { ...init, headers });
}
