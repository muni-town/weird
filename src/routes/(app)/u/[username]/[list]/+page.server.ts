import type { PageServerLoad } from '../$types';
import { getProfileByUsername, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	params,
	url
}): Promise<{
	links: { label: string; url: string }[];
}> => {
    const profile = await getProfileByUsername(params.username);
    if (!profile) return error(404, 'User not found.');
    const links = profile.lists.find((list) => list.label === params.list)?.links;

    return { links };
};
