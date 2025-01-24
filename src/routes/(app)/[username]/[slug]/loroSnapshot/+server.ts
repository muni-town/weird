import { subspace_link } from '$lib/leaf';
import { pages } from '$lib/pages/server';
import { usernames } from '$lib/usernames';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, fetch, params, url }) => {
	const fullUsername = usernames.fullDomain(params.username!);
	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const pageLink = subspace_link(subspace, params.slug!);

	const snapshot = await pages.getLoroSnapshot(pageLink);

	return new Response();
};
