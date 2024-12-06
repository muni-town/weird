import { billing } from '$lib/billing';
import { deleteAllProfileDataById as deleteAllUserDataById } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { usernames } from '$lib/usernames';
import { type RequestHandler, error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ fetch, request }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(404, 'Unauthorized');

	// Cancel any billing subscription that might exist
	try {
		await billing.cancelBillingSubscription(sessionInfo.user_id);
	} catch (_) {}

	// Delete all user entities
	await deleteAllUserDataById(sessionInfo.user_id);
	const username = await usernames.getByRauthyId(sessionInfo.user_id);
	if (username) await usernames.unset(username);

	return new Response();
};
