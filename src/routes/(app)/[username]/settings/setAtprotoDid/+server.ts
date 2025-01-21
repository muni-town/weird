import { getSession } from '$lib/rauthy/server';
import { error, type RequestHandler } from '@sveltejs/kit';
import { profileLinkById, setAtprotoDid } from '$lib/leaf/profile';
import { isDid } from '@atproto/did';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const did = await request.text();
	if (!isDid(did)) return error(400, 'Invalid DID');

	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) {
		return new Response(null, { status: 403 });
	}
	const profileLink = await profileLinkById(sessionInfo.user_id);
	await setAtprotoDid(profileLink, did || undefined);

	return new Response();
};
