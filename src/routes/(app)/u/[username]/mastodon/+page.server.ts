import type { PageServerLoad } from '../$types';
import type { MastodonProfile } from './mastodon';
import { getProfileByUsername, type Profile } from '$lib/leaf/profile';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({
	fetch,
	params,
	url
}): Promise<{
	profile: Profile;
	params: typeof params;
	mastodon_profile: MastodonProfile;
	search?: string;
}> => {
	const profile = await getProfileByUsername(params.username);
	if (!profile) return error(404, 'User not found.');
	if (!profile.mastodon_profile) return error(404, 'Mastodon profile not registered with user.');

	const pubpage_theme = profile.pubpage_theme;
	const mastodon = profile.mastodon_profile;

	const mastodon_data = await fetch(
		`${mastodon.server}/api/v1/accounts/lookup?acct=${mastodon.username}`,
		{
			method: 'GET'
		}
	).then((r) => r.json());

	const mastodon_profile = {
		id: mastodon_data.id,
		username: mastodon_data.acct,
		display_name: mastodon_data.display_name,
		description: mastodon_data.note,
		uri: mastodon_data.uri,
		avatar: mastodon_data.avatar,
		header: mastodon_data.header,
		followers_count: mastodon_data.followers_count,
		following_count: mastodon_data.following_count,
		statuses_count: mastodon_data.statuses_count,
		fields: mastodon_data.fields,
		mastodon_server: mastodon.server ? mastodon.server.replace('https://', '') : '',
		subsite_theme: pubpage_theme
	};

	return { profile, params, mastodon_profile, search: url.searchParams.get('q') || undefined };
};
