import type { PageServerLoad } from './$types';
import { appendSubpath, getMarkdownPage, profileLinkByUsername } from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { env } from '$env/dynamic/public';
import { parseUsername } from '$lib/utils';

export const load: PageServerLoad = async ({
	params
}): Promise<{ slug: string; username: string; html?: string }> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}/${params.slug}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;
	const profileLink = await profileLinkByUsername(fullUsername);

	if (!profileLink) return error(404, `User not found: ${fullUsername}`);
	const pageLink = appendSubpath(profileLink, params.slug);
	const markdown = await getMarkdownPage(pageLink);
	if (!markdown) return error(404, 'Page not found');

	return {
		slug: params.slug,
		username: fullUsername,
		html: sanitizeHtml(marked.parse(markdown) as string)
	};
};
