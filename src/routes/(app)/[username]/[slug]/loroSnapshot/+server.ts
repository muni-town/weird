import { subspace_link } from '$lib/leaf';
import { pages } from '$lib/pages/server';
import { getSession } from '$lib/rauthy/server';
import { usernames } from '$lib/usernames';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, request, fetch }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(403, `Not logged in`);

	const fullUsername = await usernames.getByRauthyId(sessionInfo.user_id);
	if (!fullUsername) return error(404, `User not found`);
	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const pageLink = subspace_link(subspace, params.slug!);

	const snapshot = await pages.getLoroSnapshot(pageLink);
	if (!snapshot) return error(404, `Snapshot not found`);

	return new Response(snapshot);
};
