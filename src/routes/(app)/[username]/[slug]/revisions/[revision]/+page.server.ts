import type { PageServerLoad } from './$types';
import { WebLinks, WeirdWikiRevisionAuthor } from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { leafClient, subspace_link } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';
import { Page } from '../../../types';
import { usernames } from '$lib/usernames/index';

export const load: PageServerLoad = async ({
	params
}): Promise<{ page: Page; revisionAuthor: string }> => {
	const username = usernames.shortNameOrDomain(params.username);
	if (username != params.username) {
		return redirect(302, `/${username}/${params.slug}`);
	}
	const fullUsername = usernames.fullDomain(username);

	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const revisionLink = subspace_link(subspace, params.slug, { Uint: BigInt(params.revision) });

	const ent = await leafClient.get_components(
		revisionLink,
		CommonMark,
		WebLinks,
		Name,
		WeirdWikiRevisionAuthor
	);
	if (!ent) return error(404, 'Revision not found');

	let display_name = ent.get(Name)?.value;
	let links = ent.get(WebLinks)?.value;

	const commonMark = ent.get(CommonMark)?.value;

	if (!display_name) {
		display_name = env.PUBLIC_INSTANCE_NAME;
	}

	const authorId = ent.get(WeirdWikiRevisionAuthor)?.value;
	const revisionAuthor =
		(await (async () => {
			if (!authorId) return;
			return await usernames.getByRauthyId(authorId);
		})()) || '';

	return {
		page: {
			slug: params.slug,
			display_name,
			markdown: commonMark || '',
			links: links || [],
			wiki: false
		},
		revisionAuthor
	};
};
