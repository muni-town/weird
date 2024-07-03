import type { PageServerLoad } from '../$types';
import { backendFetch } from '$lib/backend';
import { getSession } from '$lib/rauthy/server';
import type { Profile } from '../../../auth/v1/account/proxy+page.server';
import type { MastodonProfile } from './mastodon';

export const load: PageServerLoad = async ({
	fetch,
	request,
	params,
	url
}): Promise<{
	profile: Profile | { error: string };
	params: typeof params;
	mastodon_profile: MastodonProfile;
	search?: string;
}> => {
	let { userInfo } = await getSession(fetch, request);
	const loggedIn = !!userInfo;

	const resp = await backendFetch(fetch, `/profile/username/${params.username}`);
	const profile: Profile = await resp.json();

	if (!loggedIn) {
		profile.contact_info = undefined;
	}
	if ('error' in profile) return { profile, params, mastodon_profile: {} as MastodonProfile };

	const mastodon_server = profile.mastodon_server;
	const mastodon_username = profile.mastodon_username;
	const mastodon_access_token = profile.mastodon_access_token;

	const mastodon_data = await fetch(
		`${mastodon_server}/api/v1/accounts/lookup?acct=${mastodon_username}`,
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
		mastodon_server: mastodon_server ? mastodon_server.replace('https://', '') : ''
	};

	return { profile, params, mastodon_profile, search: url.searchParams.get('q') || undefined };
};
