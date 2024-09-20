import type { PageServerLoad } from './$types';
import {
	listChildren,
	profileLinkByUsername,
	type Profile,
	getProfile,
	appendSubpath
} from '$lib/leaf/profile';
import { env } from '$env/dynamic/public';
import { error, redirect } from '@sveltejs/kit';
import { parseUsername } from '$lib/utils';
import { leafClient } from '$lib/leaf';
import { Name } from 'leaf-proto/components';

export const load: PageServerLoad = async ({
	params
}): Promise<{
	profile: Profile | { error: string };
	username: { name: string; domain?: string };
	params: typeof params;
	pages: { slug: string; name?: string }[];
}> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;

	const profileLink = await profileLinkByUsername(fullUsername);
	if (!profileLink) return error(404, `User not found: ${username}`);
	const profile: Profile | undefined = await getProfile(profileLink);
	if (!profile) return error(404, `User not found: ${username}`);

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

	return { profile, username, params: { ...params }, pages };
};
