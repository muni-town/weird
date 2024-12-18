import { proxy_to_rauthy } from '$lib/rauthy/server';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	return redirect(303, `/login${url.search}${url.hash}`);
};

export const fallback = proxy_to_rauthy;
