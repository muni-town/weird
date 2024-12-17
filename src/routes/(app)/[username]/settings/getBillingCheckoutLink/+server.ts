import { billing } from '$lib/billing';
import { getUserInfo } from '$lib/rauthy/server';
import { type RequestHandler, error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ fetch, request }) => {
	const { userInfo } = await getUserInfo(fetch, request);
	if (!userInfo) return error(404, 'Unauthorized');
	const checkoutUrl = await billing.getCheckoutLink(userInfo.email, userInfo.id);
	return new Response(checkoutUrl);
};
