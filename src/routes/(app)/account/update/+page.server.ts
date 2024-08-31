import { env } from '$env/dynamic/public';
import { type Profile, setProfileById, setAvatarById } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { type CheckResponseError } from '$lib/utils';
import { fail, type Actions } from '@sveltejs/kit';
import { RawImage } from 'leaf-proto/components';
import Jimp from 'jimp';

export const actions = {
	default: async ({ fetch, request }) => {
		let { userInfo } = await getSession(fetch, request);
		if (!userInfo) return fail(403, { error: 'Not logged in' });

		const data = await request.formData();
		let token = data.get('token');
		if (token === '') token = null;

		if (!userInfo) {
			if (!token) return fail(400, { error: 'Must be logged in to update profile.' });
		}

		let username = data.get('username')?.toString() || undefined;
		if (username === '') {
			username = undefined;
		} else {
			if (!username?.includes('@')) username = `${username}@${env.PUBLIC_DOMAIN}`;
		}
		let display_name = data.get('display_name')?.toString() || undefined;
		if (display_name === '') {
			display_name = undefined;
		}
		// let location = data.get('location');
		// if (location == '') {
		// 	location = null;
		// }
		// let contact_info = data.get('contact_info');
		// if (contact_info == '') {
		// 	contact_info = null;
		// }
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

		// let work_capacity = data.get('work_capacity');
		// if (work_capacity == '') {
		// 	work_capacity = null;
		// }
		// let work_compensation = data.get('work_compensation');
		// if (work_compensation == '') {
		// 	work_compensation = null;
		// }
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
				const origData = await avatarData.arrayBuffer();
				const image = await Jimp.read(origData as any);
				const width = image.getWidth();
				const height = image.getHeight();
				const scale = 256 / Math.max(width, height);
				const resized = image.resize(width * scale, height * scale);
				await setAvatarById(
					userInfo.id,
					new RawImage('image/jpeg', await image.getBufferAsync(Jimp.MIME_JPEG))
				);
			}
		} catch (e) {
			console.error('Error updating profile:', e);
			const data = JSON.parse((e as CheckResponseError).data);
			return fail(400, { error: `Error updating profile avatar: ${data.error}` });
		}

		try {
			await setProfileById(userInfo.id, profile);
		} catch (e) {
			console.error('Error updating profile:', e);
			return fail(400, { error: `Error updating profile: ${e}` });
		}
	}
} satisfies Actions;
