import type { PageServerLoad } from './$types';
import { getProfiles as listProfiles, type Profile } from '$lib/leaf/profile';

export const load: PageServerLoad = async ({}): Promise<{
	profiles: (Profile & { username: string })[];
	randomSeed: number;
}> => {
	return {
		profiles: (await listProfiles())
			.map((x) => (x.username ? { username: x.username, ...x.profile } : undefined))
			.filter((x) => !!x) as any,
		randomSeed: Math.random()
	};
};
