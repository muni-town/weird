import type { PageServerLoad } from './$types';
import { getProfileByUsername, type Profile } from '$lib/leaf/profile';
import { env } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params
}): Promise<{ profile: Profile | { error: string }; params: typeof params }> => {
	const username = params.username;
	const full_username = username.includes('@') ? username : `${username}@${env.PUBLIC_DOMAIN}`;

	const profile: Profile | undefined = await getProfileByUsername(full_username);

	if (!profile) return error(404, `User not found: ${username}`);

	return { profile, params: { ...params } };
};
