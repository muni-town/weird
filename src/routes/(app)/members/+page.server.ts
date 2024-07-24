import type { PageServerLoad } from './$types';
import { getProfiles as listProfiles, type Profile } from '$lib/leaf/profile';

export const load: PageServerLoad = async ({
	url
}): Promise<{ profiles: Profile[]; search?: string }> => {
	return { profiles: await listProfiles(), search: url.searchParams.get('q') || undefined };
};
