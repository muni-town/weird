import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return error(404, 'Page not found');
};
