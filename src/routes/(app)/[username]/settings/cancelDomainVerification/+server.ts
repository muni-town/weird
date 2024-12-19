import { getSession } from '$lib/rauthy/server';
import { usernames } from '$lib/usernames';
import { type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) {
		return new Response(null, { status: 403 });
	}

	try {
		await usernames.removeDomainVerificationJob(sessionInfo.user_id);
		return new Response();
	} catch (_e) {
		return new Response(null, { status: 500 });
	}
};
