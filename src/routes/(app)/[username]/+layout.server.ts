import { appendSubpath, getProfile, listChildren, profileLinkByUsername } from '$lib/leaf/profile';
import { fullyQualifiedUsername } from '$lib/utils/username';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';
import { getSession } from '$lib/rauthy/server';
import { leafClient } from '$lib/leaf';
import { Name } from 'leaf-proto/components';

export const load: LayoutServerLoad = async ({ fetch, params, request }) => {
	let fullUsername = fullyQualifiedUsername(params.username!).toString();
	let profileMatchesUserSession = false;

	const profileLink = await profileLinkByUsername(fullUsername);
	if (!profileLink) return error(404, `User not found: ${fullUsername}`);

	const profile = await getProfile(profileLink);
	if (!profile) {
		return error(404, `User profile not found: ${fullUsername}`);
	}

	const { sessionInfo } = await getSession(fetch, request);
	if (sessionInfo) {
		const last = profileLink.path[profileLink.path.length - 1];
		if ('String' in last && last.String == sessionInfo.user_id) {
			profileMatchesUserSession = true;
		}
	}

	const pageSlugs = await listChildren(profileLink);
	const pages = (
		await Promise.all(
			pageSlugs.map(async (slug) => {
				const link = appendSubpath(profileLink, slug);
				const ent = await leafClient.get_components(link, Name);
				if (!ent) return undefined;
				return { slug, name: ent.get(Name)?.value };
			})
		)
	).filter((x) => x) as { slug: string; name?: string }[];

	return { profile, profileMatchesUserSession, pages };
};
