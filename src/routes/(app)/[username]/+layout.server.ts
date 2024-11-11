import { appendSubpath, getProfile, listChildren, profileLinkByUsername } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';
import { getSession } from '$lib/rauthy/server';
import { leafClient, subspace_link } from '$lib/leaf';
import { Name } from 'leaf-proto/components';
import { env } from '$env/dynamic/public';
import { userRauthyIdByUsername, userSubspaceByUsername } from '$lib/usernames';

export const load: LayoutServerLoad = async ({ fetch, params, request }) => {
	const fullUsername = params.username!.includes('.')
		? params.username!
		: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
	let profileMatchesUserSession = false;

	const subspace = await userSubspaceByUsername(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);

	const profile = (await getProfile(subspace_link(subspace, null))) || { tags: [], links: [] };

	const { sessionInfo } = await getSession(fetch, request);
	if (sessionInfo && sessionInfo.user_id == (await userRauthyIdByUsername(fullUsername))) {
		profileMatchesUserSession = true;
	}

	const pageSlugs = await listChildren(subspace_link(subspace));
	const pages = (
		await Promise.all(
			pageSlugs.map(async (slug) => {
				const link = subspace_link(subspace, slug);
				const ent = await leafClient.get_components(link, Name);
				if (!ent) return undefined;
				return { slug, name: ent.get(Name)?.value };
			})
		)
	).filter((x) => x) as { slug: string; name?: string }[];

	return { profile, profileMatchesUserSession, pages, username: fullUsername };
};
