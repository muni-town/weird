import type { PageServerLoad } from './$types';
import { getProfiles as listProfiles, type Profile } from '$lib/leaf/profile';

export const load: PageServerLoad = async ({}): Promise<{
	profiles: Profile[];
}> => {
	return {
		profiles: (await listProfiles()).map((x) => x.profile)
	};
};
