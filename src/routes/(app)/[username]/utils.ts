import { env } from '$env/dynamic/public';
import { profileLinkByUsername } from '$lib/leaf/profile';
import { userRauthyIdByUsername } from '$lib/usernames';
import { error } from '@sveltejs/kit';

export async function ensureUsernameMatchesSessionUserId(
	username: string,
	userId: string
): Promise<Response | undefined> {
	const fullUsername = username.includes('.')
		? username
		: `${username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
	const id = await userRauthyIdByUsername(fullUsername);

	if (userId != id) {
		return error(403, 'Unauthorized')
	}
}
