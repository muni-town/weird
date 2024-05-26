import type { LayoutServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';

// TODO: Move this logic to a "SessionProvider" component.
export const load: LayoutServerLoad = async ({ fetch, request }) => {
	return await getSession(fetch, request);
};
