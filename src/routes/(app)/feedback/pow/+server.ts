import { Pow } from '$lib/pow';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const challenge = Pow.build_challenge(60 * 2, 19);
	return new Response(challenge);
};
