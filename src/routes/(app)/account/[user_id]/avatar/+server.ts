import { env } from '$env/dynamic/public';
import { getAvatarById } from '$lib/leaf/profile';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch, params }) => {
	let fallbackAvatar = `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${params.user_id}`;
	const avatar = params.user_id && (await getAvatarById(params.user_id));
	if (!avatar) return fetch(fallbackAvatar);

	return new Response(new Uint8Array(avatar.value.data), {
		headers: [['content-type', avatar.value.mimeType]]
	});
};
