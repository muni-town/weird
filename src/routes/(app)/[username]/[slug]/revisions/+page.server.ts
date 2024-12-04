import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { leafClient, subspace_link } from '$lib/leaf';
import { usernames } from '$lib/usernames/index';

export const load: PageServerLoad = async ({
	params
}): Promise<{ revisions: (number | bigint)[] }> => {
	const username = params.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0];
	if (username != params.username) {
		return redirect(302, `/${username}/${params.slug}`);
	}
	const fullUsername = params.username!.includes('.')
		? params.username!
		: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);

	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const pageLink = subspace_link(subspace, params.slug);

	const links = await leafClient.list_entities(pageLink);
	const revisions = [];
	for (const link of links) {
		const last = link.path[link.path.length - 1];
		if ('Uint' in last) {
			revisions.push(last.Uint);
		}
	}

	revisions.sort();
	// Remove the last revision because it's the same as the current one
	revisions.pop();
	revisions.reverse();

	return {
		revisions
	};
};
