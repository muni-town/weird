import { env } from '$env/dynamic/public';
import { getAvatarByUsername } from '$lib/leaf/profile';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const username = params.username!.includes('@')
		? params.username!
		: `${params.username}@${env.PUBLIC_DOMAIN}`;

	const avatar = params.username && (await getAvatarByUsername(username));
	if (!avatar) return error(404, 'Avatar not found');

	return new Response(new Uint8Array(avatar.value.data), {
		headers: [['content-type', avatar.value.mimeType]]
	});
};
