import { env } from '$env/dynamic/public';
import { usernames } from '$lib/usernames/index';
import { error } from '@sveltejs/kit';

export async function ensureUsernameMatchesSessionUserId(
	username: string,
	userId: string
): Promise<Response | undefined> {
	const fullUsername = usernames.fullDomain(username);
	const id = await usernames.getRauthyId(fullUsername);

	if (userId != id) {
		return error(403, 'Unauthorized');
	}
}
