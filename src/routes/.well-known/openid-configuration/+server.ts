import { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
	return fetch('/auth/v1/.well-known/openid-configuration');
};
