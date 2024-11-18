import type { Actions, PageServerLoad } from './$types';
import {
	WebLinks,
	WeirdWikiPage,
	WeirdWikiRevisionAuthor,
	appendSubpath,
	getProfileById,
	profileLinkById,
	profileLinkByUsername
} from '$lib/leaf/profile';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { leafClient, subspace_link } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';
import { Page } from '../../../types';
import { userNameByRauthyId, userSubspaceByUsername } from '$lib/usernames/index';

export const load: PageServerLoad = async ({
	params
}): Promise<{ page: Page; revisionAuthor: string }> => {
	const username = params.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0];
	if (username != params.username) {
		return redirect(302, `/${username}/${params.slug}`);
	}
	const fullUsername = params.username!.includes('.')
		? params.username!
		: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;

	const subspace = await userSubspaceByUsername(fullUsername);
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
			return await userNameByRauthyId(authorId);
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
