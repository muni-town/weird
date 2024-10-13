import { getProfiles, setProfile } from '$lib/leaf/profile';
import { getSession } from '$lib/rauthy/server';
import { parseUsername } from '$lib/utils/username';
import type { Actions } from './$types';
import { error } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const domain = formData.get('domain')?.toString();
		if (!domain) error(400, 'You must provide a domain');

		for (const { link, profile } of await getProfiles()) {
			if (!profile.username) continue;
			const { name } = parseUsername(profile.username);
			profile.username = `${name}@${domain}`;
			await setProfile(link, profile);
		}
	}
} satisfies Actions;
