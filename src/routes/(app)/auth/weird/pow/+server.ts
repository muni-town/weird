import { get_pow_challenge } from '$lib/rauthy/server';
import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return text(await get_pow_challenge());
};
