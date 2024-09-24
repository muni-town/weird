import type { Actions, PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { profileLinkById, appendSubpath, WebLinks, WebLink } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';
import { leafClient } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params
}): Promise<{ slug: string; pageName?: string; links?: WebLink[]; markdown?: string }> => {
	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return error(403, 'You must be logged in');

	const profileLink = profileLinkById(sessionInfo.user_id);
	const pageLink = appendSubpath(profileLink, params.slug);

	const ent = await leafClient.get_components(pageLink, CommonMark, WebLinks, Name);
	if (!ent) return { slug: params.slug };

	let pageName = ent.get(Name)?.value;
	let links = ent.get(WebLinks)?.value;
	let markdown = ent.get(CommonMark)?.value;

	return { slug: params.slug, pageName, links, markdown };
};

export const actions = {
	default: async ({ request, fetch }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) {
			throw 'User not logged in';
		}
		const formData = await request.formData();
		const slug = formData.get('slug')?.toString();
		if (!slug) return error(400, 'Missing slug');

		const profileLink = profileLinkById(sessionInfo.user_id);
		const pageLink = appendSubpath(profileLink, slug);

		if (formData.get('delete')) {
			await leafClient.del_entity(pageLink);
		} else {
			const pageName = formData.get('pageName')?.toString();
			const markdown = formData.get('markdown')?.toString();
			const linksStr = formData.get('links')?.toString();
			const links = linksStr ? (JSON.parse(linksStr) as WebLink[]) : undefined;

			const toDelete = [];
			const toAdd = [];
			if (!pageName) {
				toDelete.push(Name);
			} else {
				toAdd.push(new Name(pageName));
			}
			if (!markdown) {
				toDelete.push(CommonMark);
			} else {
				toAdd.push(new CommonMark(markdown));
			}
			if (!links) {
				toDelete.push(WebLinks);
			} else {
				toAdd.push(new WebLinks(links));
			}
			await leafClient.del_components(pageLink, toDelete);
			await leafClient.add_components(pageLink, toAdd);
		}
	}
} satisfies Actions;
