import { getSession, getUserInfo } from '$lib/rauthy/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserInfo } from '$lib/rauthy';
import { checkResponse } from '$lib/utils';
import { getProfileById, type Profile } from '$lib/leaf/profile';
import { env } from '$env/dynamic/public';
import { setProfileById, setAvatarById } from '$lib/leaf/profile';
import { type CheckResponseError } from '$lib/utils';
import { fail, type Actions } from '@sveltejs/kit';
import { RawImage } from 'leaf-proto/components';
import sharp from 'sharp';

export const load: PageServerLoad = async ({
	fetch,
	request
}): Promise<{
	profile?: Profile;
	providers: { id: string; name: string }[];
	userInfo: UserInfo;
}> => {
	const { userInfo } = await getUserInfo(fetch, request);
	if (!userInfo) {
		return redirect(303, '/login');
	}
	let providers = [];
	try {
		const providersResp = await fetch('/auth/v1/providers/minimal', {
			headers: [['x-forwarded-for', request.headers.get('x-forwarded-for')!]]
		});
		await checkResponse(providersResp);
		providers = await providersResp.json();
	} catch (e) {
		console.error('Error getting providers:', e);
	}

	const profile = await getProfileById(userInfo.id);

	return { userInfo, providers, profile };
};

export const actions = {
	update: async ({ fetch, request }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return fail(403, { error: 'Not logged in' });

		const data = await request.formData();

		let username = data.get('username')?.toString() || undefined;
		if (username === '') {
			username = undefined;
		} else if (username) {
			if (!username?.includes('@')) username = `${username}@${env.PUBLIC_DOMAIN}`;
		}
		let display_name = data.get('display_name')?.toString() || undefined;
		if (display_name === '') {
			display_name = undefined;
		}
		let tagsInput = data.get('tags');
		let tags: string[] = [];
		if (tagsInput) {
			const trimmedInput = tagsInput.toString().trim();
			tags = trimmedInput
				.split(',')
				.map((x) => x.trim())
				.filter((x) => x.length > 0);
		}
		let linkUrlsInput = data.getAll('link-url');
		let linkLabelsInput = data.getAll('link-label');
		let links: { label: string; url: string }[] = [];
		for (let i = 0; i < linkUrlsInput.length; i++) {
			let url = linkUrlsInput[i].toString();
			if (url.length == 0) continue;
			let label = linkLabelsInput[i].toString();
			links.push({ url, label });
		}
		let bio = data.get('bio')?.toString() || undefined;
		if (bio === '') {
			bio = undefined;
		}
		let mastodon_server = data.get('mastodon_server');
		if (mastodon_server == '') {
			mastodon_server = null;
		}
		let mastodon_username = data.get('mastodon_username');
		if (mastodon_username == '') {
			mastodon_username = null;
		}
		const mastodon_profile =
			(mastodon_server &&
				mastodon_username && {
					server: mastodon_server.toString(),
					username: mastodon_username.toString()
				}) ||
			undefined;

		let pubpage_theme = data.get('subsite_theme')?.toString() || undefined;
		if (pubpage_theme === '') {
			pubpage_theme = undefined;
		}

		const profile: Profile = {
			username,
			display_name,
			tags,
			links,
			bio,
			mastodon_profile,
			pubpage_theme
		};

		try {
			const avatarData = data.get('avatar') as File;
			if (avatarData.name != '') {
				const origData = new Uint8Array(await avatarData.arrayBuffer());
				const resized = new Uint8Array(
					(await sharp(origData).resize(256, 256).webp().toBuffer()).buffer
				);
				await setAvatarById(sessionInfo.user_id, new RawImage('image/webp', resized));
			}
		} catch (e) {
			console.error('Error updating profile:', e);
			const data = JSON.parse((e as CheckResponseError).data);
			return fail(400, { error: `Error updating profile avatar: ${data.error}` });
		}

		try {
			await setProfileById(sessionInfo.user_id, profile);
		} catch (e) {
			console.error('Error updating profile:', e);
			return fail(400, { error: `Error updating profile: ${e}` });
		}
	},
	claimUsername: async ({ fetch, request }) => {
		const { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo) return fail(403, { error: 'Not logged in' });

		const formData = await request.formData();
		const username = formData.get('username') as string;
		if (!username) return fail(400, { error: 'Username not provided ' });

		try {
			await setProfileById(sessionInfo.user_id, {
				username: `${username}@${env.PUBLIC_DOMAIN}`,
				tags: [],
				links: []
			});
		} catch (error) {
			return fail(400, { error });
		}

		return redirect(303, '/my-profile');
	},
	fetchGitHubReadme: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		if (!username) return new Response(null);

		const repoResp = await fetch(
			`https://raw.githubusercontent.com/${username}/${username}/HEAD/README.md`
		);
		const profile = await repoResp.text();
		return profile;
	}
} satisfies Actions;
