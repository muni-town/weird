import type { Actions, PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import {
	profileLinkById,
	appendSubpath,
	getMarkdownPage,
	setMarkdownPage as setMarkdownPage
} from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params
}): Promise<{ slug: string; markdown?: string }> => {
	let { userInfo } = await getSession(fetch, request);
	if (userInfo) {
		const profileLink = profileLinkById(userInfo.id);
		const pageLink = appendSubpath(profileLink, params.slug);
		const markdown = await getMarkdownPage(pageLink);

		return { slug: params.slug, markdown };
	} else {
		return { slug: params.slug };
	}
};

export const actions = {
	default: async ({ request, fetch }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) {
			throw 'User not logged in';
		}
		const formData = await request.formData();
		const slug = formData.get('slug')?.toString();
		if (!slug) return error(400, 'Missing slug');
		const profileLink = profileLinkById(userInfo.id);
		const pageLink = appendSubpath(profileLink, slug);

		if (formData.get('delete')) {
			await setMarkdownPage(pageLink);
		} else {
			const markdown = formData.get('markdown')?.toString();
			if (!markdown) return error(400, 'Missing markdown');
			await setMarkdownPage(pageLink, markdown);
		}
	}
} satisfies Actions;
