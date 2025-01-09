import type { PageServerLoad } from './$types';
import { getProfileByUsername, listChildren, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';
import { usernames } from '$lib/usernames';
import { leafClient, subspace_link } from '$lib/leaf';
import { Name } from 'leaf-proto/components';

export const load: PageServerLoad = async ({
	params
}): Promise<{
	profile: Profile;
	pages: { slug: string; name?: string }[];
	params: typeof params;
}> => {
	const subspace = await usernames.getSubspace(params.username);
	if (!subspace) return error(404, `User not found: ${params.username}`);

	let profile = await getProfileByUsername(params.username);
	if (!profile) return error(404, `User profile not found: ${params.username}`);

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


	return { profile, pages, params: { ...params } };
};
