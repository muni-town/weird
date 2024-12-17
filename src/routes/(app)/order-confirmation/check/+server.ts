import { billing } from '$lib/billing';
import { getSession } from '$lib/rauthy/server';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, fetch }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return new Response(undefined, { status: 400 });

	if ((await billing.getSubscriptionInfo(sessionInfo.user_id)).isSubscribed) {
		return new Response(undefined, { status: 200 });
	} else {
		return new Response(undefined, { status: 202 });
	}
};
