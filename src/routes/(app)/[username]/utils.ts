import { env } from '$env/dynamic/public';
import { usernames } from '$lib/usernames/index';
import { error } from '@sveltejs/kit';

export async function ensureUsernameMatchesSessionUserId(
	username: string,
	userId: string
): Promise<Response | undefined> {
	const fullUsername = username.includes('.')
		? username
		: `${username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
	const id = await usernames.getRauthyId(fullUsername);

	if (userId != id) {
		return error(403, 'Unauthorized');
	}
}
