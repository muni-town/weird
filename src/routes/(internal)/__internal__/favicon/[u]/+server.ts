// Uncommenting this line breaks it!!!!
import { redis } from "$lib/redis"
import { type RequestHandler } from '@sveltejs/kit';
export const GET: RequestHandler = async ({ params }) => {
	return new Response();
};
