import type { LayoutServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';

export const load: LayoutServerLoad = async ({ fetch, request }) => {
	return await getSession(fetch, request);
};
