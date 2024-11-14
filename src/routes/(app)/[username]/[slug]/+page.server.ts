import type { Actions, PageServerLoad } from './$types';
import { WebLinks, WeirdWikiPage, WeirdWikiRevisionAuthor, appendSubpath } from '$lib/leaf/profile';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { leafClient, subspace_link } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';
import { Page } from '../types';
import { getSession } from '$lib/rauthy/server';
import { dateToUnixTimestamp } from '$lib/utils/time';
import { userRauthyIdByUsername, userSubspaceByUsername } from '$lib/usernames';

export const load: PageServerLoad = async ({ params }): Promise<{ page: Page }> => {
	const username = params.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0];
	if (username != params.username) {
		return redirect(302, `/${username}/${params.slug}`);
	}
	const fullUsername = params.username!.includes('.')
		? params.username!
		: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;

	const subspace = await userSubspaceByUsername(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);
	const pageLink = subspace_link(subspace, params.slug);

	const ent = await leafClient.get_components(pageLink, CommonMark, WebLinks, Name, WeirdWikiPage);
	if (!ent) return error(404, 'Page not found');

	let display_name = ent.get(Name)?.value;
	let links = ent.get(WebLinks)?.value;
	const wiki = !!ent.get(WeirdWikiPage);

	const commonMark = ent.get(CommonMark)?.value;

	if (!display_name) {
		display_name = env.PUBLIC_INSTANCE_NAME;
	}

	return {
		page: {
			slug: params.slug,
			display_name,
			markdown: commonMark || '',
			links: links || [],
			wiki
		}
	};
};

export const actions = {
	default: async ({ request, params, url, fetch }) => {
		const fullUsername = params.username!.includes('.')
			? params.username!
			: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
		const subspace = await userSubspaceByUsername(fullUsername);
		if (!subspace) return error(404, `User not found: ${fullUsername}`);

		const oldPageLink = subspace_link(subspace, params.slug);

		const oldEnt = await leafClient.get_components(oldPageLink, WeirdWikiPage);
		const isWikiPage = !!oldEnt?.get(WeirdWikiPage);

		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return redirect(302, `/login?to=${url}`);

		const editorIsOwner = sessionInfo.user_id == (await userRauthyIdByUsername(fullUsername));

		// If this isn't a wiki page, we need to make sure that only the author can edit the page.
		if (!isWikiPage && !editorIsOwner) {
			return error(403, `Unauthorized: only owner is allowed to edit this page.`);
		}

		let data: Page;
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
			data = Page.parse(parsedData);

			// Only the page owner is allowed to rename the page
			newSlug = editorIsOwner ? data.slug : params.slug;

			const pageLink = subspace_link(subspace, newSlug);
			const revisionLink = appendSubpath(pageLink, { Uint: dateToUnixTimestamp(new Date()) });

			if (data.slug != params.slug) {
				await leafClient.del_entity(oldPageLink);
			}

			const components = [
				new Name(data.display_name),
				data.markdown.length > 0 ? new CommonMark(data.markdown) : CommonMark,
				data.links.length > 0 ? new WebLinks(data.links) : WebLinks,
				// non-owners are not allowed to change the wiki page status
				(editorIsOwner ? data.wiki : isWikiPage) ? new WeirdWikiPage() : WeirdWikiPage
			];
			await leafClient.update_components(pageLink, components);
			await leafClient.update_components(revisionLink, [
				...components,
				new WeirdWikiRevisionAuthor(sessionInfo.user_id)
			]);
		} catch (e: any) {
			return fail(500, { error: JSON.stringify(e) });
		}

		redirect(302, `/${params.username}/${newSlug}`);
	}
} satisfies Actions;
