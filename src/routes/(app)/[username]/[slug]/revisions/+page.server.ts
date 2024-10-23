import type { PageServerLoad } from './$types';
import { appendSubpath, profileLinkByUsername } from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { parseUsername } from '$lib/utils/username';
import { leafClient } from '$lib/leaf';

export const load: PageServerLoad = async ({
	params
}): Promise<{ revisions: (number | bigint)[] }> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}/${params.slug}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;
	const profileLink = await profileLinkByUsername(fullUsername);

	if (!profileLink) return error(404, `User not found: ${fullUsername}`);
	const pageLink = appendSubpath(profileLink, params.slug);

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
