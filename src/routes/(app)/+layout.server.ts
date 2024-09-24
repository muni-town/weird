import type { LayoutServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';

export const load: LayoutServerLoad = async ({ fetch, request }) => {
	// Load the user session and add it to the page data.
	return await getSession(fetch, request);
};
