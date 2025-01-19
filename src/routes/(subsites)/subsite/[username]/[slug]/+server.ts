import { error, type RequestHandler } from '@sveltejs/kit';
import { createThemeData, renderPage } from '$lib/renderer';
import weirdPageTheme from '$lib/themes/weird/page.html.j2?raw';
import { usernames } from '$lib/usernames';
import { getProfile, getTheme, listChildren, profileLinkByUsername } from '$lib/leaf/profile';
import { leafClient, subspace_link } from '$lib/leaf';
import { CommonMark, Name } from 'leaf-proto/components';

export const GET: RequestHandler = async ({ params }) => {
	const subspace = await usernames.getSubspace(params.username!);
	if (!subspace) return error(404, `User not found: ${params.username}`);

	const slug = params.slug!;
	const pageLink = subspace_link(subspace, slug);
	const pageEnt = await leafClient.get_components(pageLink, Name, CommonMark);
	if (!pageEnt) return error(404, `Page not found: ${slug}`);
	const markdown = pageEnt.get(CommonMark)?.value || '';
	const title = pageEnt.get(Name)?.value || '';

	const profileLink = await profileLinkByUsername(params.username!);
	if (!profileLink) return error(404, `User profile not found: ${params.username}`);
	let profile = await getProfile(profileLink);
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

	const data = await getTheme(profileLink);

	const profileInfo = {
		handle: params.username!,
		bio: profile.bio,
		display_name: profile.display_name,
		social_links: profile.social_links,
		tags: profile.tags,
		links: profile.links,
		pages
	};
	const pageInfo = {
		slug,
		title,
		markdown
	};

	let output: string;
	if (data) {
		try {
			// Try to render the user's theme
			output = await renderPage(profileInfo, pageInfo, data.data);
		} catch (_) {
			// If rendering the user's theme fails, then render with the default theme
			output = await renderPage(profileInfo, pageInfo, createThemeData('', weirdPageTheme));
		}
	} else {
		output = await renderPage(profileInfo, pageInfo, createThemeData(' ', weirdPageTheme));
	}

	return new Response(output, { headers: [['content-type', 'text/html']] });
};
