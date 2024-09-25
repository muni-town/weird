import { base32Encode, type ExactLink } from 'leaf-proto';
import { leafClient } from './leaf';
import { RawImage } from 'leaf-proto/components';
import { env } from '$env/dynamic/public';

/**
 * Formats an image response from the `RawImage` component of the provided entity link, optionally
 * falling back to a generated avatar.
 *
 * This function will use the entities digest as the `Etag` header in the response to optimize the
 * browser caching.
 *
 * The fetch function is only required if you set a fallback avatar seed, in which case it will be
 * used to fetch the fallback avatar.
 * */
export async function createImageResponse(
	link: ExactLink,
	fetch?: typeof globalThis.fetch,
	fallbackAvatarSeed?: string
): Promise<Response> {
	let fallbackAvatar = fallbackAvatarSeed
		? `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${fallbackAvatarSeed}`
		: undefined;
	const ent = await leafClient.get_components(link, RawImage);
	const image = ent?.get(RawImage)?.value;
	if (!ent || !image) {
		if (fallbackAvatar && fetch) {
			return fetch(fallbackAvatar);
		} else {
			return new Response(undefined, { status: 404, statusText: 'Image not found' });
		}
	}
	const etag = base32Encode(ent.digest);
	return new Response(new Uint8Array(image.data), {
		headers: [
			['content-type', image.mimeType],
			['etag', etag]
		]
	});
}
