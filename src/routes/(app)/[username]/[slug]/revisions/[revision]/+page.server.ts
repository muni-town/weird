import type { Actions, PageServerLoad } from './$types';
import {
	Username,
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
import { parseUsername } from '$lib/utils/username';
import { leafClient } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';
import { Page } from '../../../types';

export const load: PageServerLoad = async ({
	params
}): Promise<{ page: Page; revisionAuthor: string }> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}/${params.slug}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;
	const profileLink = await profileLinkByUsername(fullUsername);

	if (!profileLink) return error(404, `User not found: ${fullUsername}`);
	const revisionLink = appendSubpath(profileLink, params.slug, { Uint: BigInt(params.revision!) });

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
			const profileLink = profileLinkById(authorId);
			const ent = await leafClient.get_components(profileLink, Username);
			const username = ent?.get(Username)?.value;
			return username;
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
