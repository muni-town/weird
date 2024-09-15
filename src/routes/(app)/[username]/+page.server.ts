import type { PageServerLoad } from './$types';
import { listChildren, profileLinkByUsername, type Profile, getProfile } from '$lib/leaf/profile';
import { env } from '$env/dynamic/public';
import { error, redirect } from '@sveltejs/kit';
import { parseUsername } from '$lib/utils';

export const load: PageServerLoad = async ({
	params
}): Promise<{
	profile: Profile | { error: string };
	username: { name: string; domain?: string };
	params: typeof params;
	pages: string[];
}> => {
	const username = parseUsername(params.username);
	if (username.domain == env.PUBLIC_DOMAIN) {
		return redirect(302, `/${username.name}`);
	}
	const fullUsername = `${username.name}@${username.domain || env.PUBLIC_DOMAIN}`;

	const profileLink = await profileLinkByUsername(fullUsername);
	if (!profileLink) return error(404, `User not found: ${username}`);
	const profile: Profile | undefined = await getProfile(profileLink);
	if (!profile) return error(404, `User not found: ${username}`);

	const pages = await listChildren(profileLink);

	return { profile, username, params: { ...params }, pages };
};
