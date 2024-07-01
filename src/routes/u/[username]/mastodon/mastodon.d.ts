export interface MastodonField {
	name: string;
	value: string;
	verified_at: string;
}
export interface MastodonProfile {
	id: string;
	username: string;
	display_name: string;
	description: string;
	uri: string;
	avatar: string;
	header: string;
	followers_count: number;
	following_count: number;
	statuses_count: number;
	fields: MastodonField[];
	mastodon_server: string;
}
