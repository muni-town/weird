import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
	return json({
		http: {
			services: {}
		}
	});
};
