import type { Actions, PageServerLoad } from './$types';
import { WeirdWikiPage } from '$lib/leaf/profile';
import { error, fail, redirect } from '@sveltejs/kit';
import { leafClient, subspace_link } from '$lib/leaf';
import { getSession } from '$lib/rauthy/server';
import { usernames } from '$lib/usernames/index';
import { Page, PageSaveReq, pages } from '$lib/pages/server';
import { previewLinks, renderMarkdownSanitized } from '$lib/utils/markdown';

export const load: PageServerLoad = async ({
	params
}): Promise<{ page: Page & { html: string } }> => {
	const username = usernames.shortNameOrDomain(params.username);
	if (username != params.username) {
		return redirect(302, `/${username}/${params.slug}`);
	}
	const fullUsername = usernames.fullDomain(username);

	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const pageLink = subspace_link(subspace, params.slug);
	const page = await pages.get(pageLink);
	if (!page) return error(404, 'Page not found');
	const html = await previewLinks(renderMarkdownSanitized(page.markdown));

	return {
		page: { ...page, html, slug: params.slug }
	};
};

export const actions = {
	default: async ({ request, params, url, fetch }) => {
		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return redirect(302, `/login?to=${url}`);

		const fullUsername = usernames.fullDomain(params.username);
		const subspace = await usernames.getSubspace(fullUsername);
		if (!subspace) return error(404, `User not found: ${fullUsername}`);

		const oldPageLink = subspace_link(subspace, params.slug);

		const oldEnt = await leafClient.get_components(oldPageLink, WeirdWikiPage);
		const isWikiPage = !!oldEnt?.get(WeirdWikiPage);

		const editorIsOwner = sessionInfo.user_id == (await usernames.getRauthyId(fullUsername));

		// If this isn't a wiki page, we need to make sure that only the author can edit the page.
		if (!isWikiPage && !editorIsOwner) {
			return error(403, `Unauthorized: only owner is allowed to edit this page.`);
		}

		let data: PageSaveReq;
		let newSlug: string;
		const formData = await request.formData();
		if (formData.get('delete') != undefined) {
			if (editorIsOwner) {
				leafClient.del_entity(oldPageLink);
				return redirect(302, `/${params.username}`);
			} else {
				return error(403, 'Unauthorized');
			}
		}

		try {
			const parsedData = JSON.parse(formData.get('data')?.toString() || '');
			if (!parsedData) return error(400, 'Missing data field');
			data = PageSaveReq.parse(parsedData);

			// Only the page owner is allowed to rename the page or change wiki mode
			newSlug = editorIsOwner ? data.slug : params.slug;
			let newIsWikiPage = editorIsOwner ? data.wiki : isWikiPage;

			const pageLink = subspace_link(subspace, newSlug);

			// If the new slug is different than the old one delete the old page.
			if (newSlug != params.slug) {
				await leafClient.del_entity(oldPageLink);
			}

			// Save the page
			await pages.save(pageLink, {
				wiki: newIsWikiPage,
				name: data.name,
				loroSnapshot: data.loroSnapshot
			});
		} catch (e: any) {
			return fail(500, { error: JSON.stringify(e) });
		}

		redirect(302, `/${params.username}/${newSlug}`);
	}
} satisfies Actions;
