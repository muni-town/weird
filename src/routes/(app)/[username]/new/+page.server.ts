import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSession } from '$lib/rauthy/server';
import { ensureUsernameMatchesSessionUserId } from '../utils';
import { getProfileById } from '$lib/leaf/profile';
import { leafClient, subspace_link } from '$lib/leaf';
import { usernames } from '$lib/usernames/index';
import { PageSaveReq } from '$lib/pages/types';
import { pages } from '$lib/pages/server';

export const load: PageServerLoad = async ({ fetch, params, request, url }) => {
	const { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo) return redirect(302, `/login?to=${url}`);
	const resp = await ensureUsernameMatchesSessionUserId(params.username!, sessionInfo.user_id);
	if (resp) return resp;

	const profile = await getProfileById(sessionInfo.user_id);

	return { profile, userId: sessionInfo.user_id };
};

export const actions = {
	default: async ({ request, params, url, fetch }) => {
		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return redirect(302, `/login?to=${url}`);
		const resp = await ensureUsernameMatchesSessionUserId(params.username!, sessionInfo.user_id);
		if (resp) return resp;

		let data: PageSaveReq;
		try {
			const formData = JSON.parse((await request.formData()).get('data')?.toString() || '');
			if (!formData) return error(400, 'Missing data field');
			data = PageSaveReq.parse(formData);
		} catch (e) {
			return error(400, `Error parsing form data: ${e}`);
		}

		const subspace = await usernames.subspaceByRauthyId(sessionInfo.user_id);
		const pageLink = subspace_link(subspace, data.slug);

		const ent = await leafClient.get_components(pageLink);
		if (ent) return fail(400, { error: 'Page with that slug already exists.', data });

		await pages.save(pageLink, data);

		return redirect(302, `/${params.username}/${data.slug}`);
	}
} satisfies Actions;
