import { backendFetch } from '$lib/backend';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const resp = await backendFetch(fetch, `/profile/${params.user_id}/avatar`);
	return resp;
};
