import { leafClient, type KnownComponents, loadKnownComponents } from '$lib/leaf';
import { base32Decode, base32Encode, type EntityPath, type ExactLink } from 'leaf-proto';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { Tags, Username, WebLinks, WeirdCustomDomain, WeirdPubpageTheme } from '$lib/leaf/profile';
import { CommonMark, Description, Name } from 'leaf-proto/components';
import { getSession } from '$lib/rauthy/server';

type Data =
	| {
			Namespaces: string[];
	  }
	| { Subspaces: string[]; namespace: string }
	| { Entities: EntityPath[]; namespace: string; subspace: string }
	| { Entity: EntityPath; namespace: string; subspace: string; components: KnownComponents };

export const load: PageServerLoad = async ({ params }): Promise<Data> => {
	try {
		if (!params.namespace) {
			const namespaces = await leafClient.list_namespaces();
			return { Namespaces: namespaces.map((x) => base32Encode(x)) };
		} else if (params.namespace && !params.subspace) {
			const subspaces = await leafClient.list_subspaces();
			return { Subspaces: subspaces.map((x) => base32Encode(x)), namespace: params.namespace };
		} else if (params.namespace && params.subspace && !params.entityPath) {
			const namespace = base32Decode(params.namespace);
			const subspace = base32Decode(params.subspace);
			const links = await leafClient.list_entities({ namespace, subspace, path: [] });
			return {
				Entities: links.map((x) => x.path),
				namespace: params.namespace,
				subspace: params.subspace
			};
		} else if (params.namespace && params.subspace && params.entityPath) {
			const path = JSON.parse(decodeURIComponent(params.entityPath));
			const components =
				(await loadKnownComponents({
					namespace: base32Decode(params.namespace),
					subspace: base32Decode(params.subspace),
					path
				})) || {};

			return {
				Entity: path,
				namespace: params.namespace,
				subspace: params.subspace,
				components
			};
		}

		return error(404);
	} catch (_) {
		return error(404);
	}
};

export const actions = {
	save: async ({ url, request, params, fetch }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo?.roles?.includes('admin')) {
			return error(403, 'Access denied');
		}
		if (!params.namespace || !params.subspace || !params.entityPath) return fail(404);

		try {
			const link: ExactLink = {
				namespace: base32Decode(params.namespace),
				subspace: base32Decode(params.subspace),
				path: JSON.parse(decodeURIComponent(params.entityPath))
			};
			const components = [];

			const formData = await request.formData();

			let username: string | undefined = formData.get('username')?.toString() || '';
			if (username == '') username = undefined;
			components.push(username ? new Username(username) : Username);

			let name: string | undefined = formData.get('name')?.toString() || '';
			if (name == '') name = undefined;
			components.push(name ? new Name(name) : Name);

			let description: string | undefined = formData.get('description')?.toString() || '';
			if (description == '') description = undefined;
			components.push(description ? new Description(description) : Description);

			let webLinks: string | undefined = formData.get('webLinks')?.toString() || '';
			if (webLinks == '') webLinks = undefined;
			components.push(webLinks ? new WebLinks(JSON.parse(webLinks)) : WebLinks);

			let tags: string | undefined = formData.get('tags')?.toString() || '';
			if (tags == '') tags = undefined;
			components.push(
				tags
					? new Tags(
							tags
								.split(',')
								.map((x) => x.trim())
								.filter((x) => !!x)
						)
					: Tags
			);

			let pubpageTheme: string | undefined = formData.get('pubpageTheme')?.toString() || '';
			if (pubpageTheme == '') pubpageTheme = undefined;
			components.push(pubpageTheme ? new WeirdPubpageTheme(pubpageTheme) : WeirdPubpageTheme);

			let customDomain: string | undefined = formData.get('customDomain')?.toString() || '';
			if (customDomain == '') customDomain = undefined;
			components.push(customDomain ? new WeirdCustomDomain(customDomain) : WeirdCustomDomain);

			let commonMark: string | undefined = formData.get('commonMark')?.toString() || '';
			if (commonMark == '') commonMark = undefined;
			components.push(commonMark ? new CommonMark(commonMark) : CommonMark);

			await leafClient.update_components(link, components);
		} catch (e: any) {
			return fail(400, { error: JSON.stringify(e) });
		}

		const newUrl = new URL(url);
		newUrl.search = '';
		return redirect(302, newUrl);
	},
	delete: async ({ params, fetch, request }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo?.roles?.includes('admin')) {
			return error(403, 'Access denied');
		}
		if (!params.namespace || !params.subspace || !params.entityPath) {
			return error(404);
		}
		try {
			const link: ExactLink = {
				namespace: base32Decode(params.namespace),
				subspace: base32Decode(params.subspace),
				path: JSON.parse(decodeURIComponent(params.entityPath))
			};
			await leafClient.del_entity(link);
		} catch (e: any) {
			return fail(400, { error: JSON.stringify(e) });
		}
		return redirect(303, `/__internal__/admin/explorer/${params.namespace}/${params.subspace}`);
	}
} satisfies Actions;
