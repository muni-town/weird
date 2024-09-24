import type { LayoutServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { error } from '@sveltejs/kit';

// TODO: Move this logic to a "SessionProvider" component.
export const load: LayoutServerLoad = async ({ fetch, request }) => {
	const sessionInfos = await getSession(fetch, request);
	if (!sessionInfos.sessionInfo?.roles.includes('admin')) {
		return error(403, 'Access denied');
	}
	return sessionInfos;
};
