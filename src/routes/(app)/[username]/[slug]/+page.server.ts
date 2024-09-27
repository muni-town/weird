import type { PageServerLoad } from './$types';
import {
	WebLink,
	WebLinks,
	appendSubpath,
	getMarkdownPage,
	profileLinkByUsername
} from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { env } from '$env/dynamic/public';
import { parseUsername } from '$lib/utils';
import { leafClient } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';

export const load: PageServerLoad = async ({
	params
}): Promise<{
	slug: string;
	username: string;
	pageName?: string;
	links?: WebLink[];
	html?: string;
}> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}/${params.slug}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;
	const profileLink = await profileLinkByUsername(fullUsername);

	if (!profileLink) return error(404, `User not found: ${fullUsername}`);
	const pageLink = appendSubpath(profileLink, params.slug);

	const ent = await leafClient.get_components(pageLink, CommonMark, WebLinks, Name);
	if (!ent) return error(404, 'Page not found');

	let pageName = ent.get(Name)?.value;
	let links = ent.get(WebLinks)?.value;

	let html: string | undefined;
	const commonMark = ent.get(CommonMark)?.value;
	if (commonMark) {
		html = sanitizeHtml(marked.parse(commonMark) as string);
	}

	if (!(!!html || !!links)) return error(501, `Page kind not recognized`);

	if (!pageName) {
		pageName = env.PUBLIC_INSTANCE_NAME;
	}

	return {
		slug: params.slug,
		username: fullUsername,
		pageName,
		links,
		html
	};
};
