import type { PageServerLoad } from './$types';
import { listChildren, profileLinkByUsername, type Profile, getProfile } from '$lib/leaf/profile';
import { env } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	params
}): Promise<{ profile: Profile | { error: string }; params: typeof params; pages: string[] }> => {
	const username = params.username;
	const full_username = username.includes('@') ? username : `${username}@${env.PUBLIC_DOMAIN}`;

	const profileLink = await profileLinkByUsername(full_username);
	if (!profileLink) return error(404, `User not found: ${username}`);
	const profile: Profile | undefined = await getProfile(profileLink);
	if (!profile) return error(404, `User not found: ${username}`);

	const pages = await listChildren(profileLink);

	return { profile, params: { ...params }, pages };
};
