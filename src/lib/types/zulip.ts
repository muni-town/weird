export type ZulipMessage = {
	id: number;
	sender_full_name: string;
	sender_email: string;
	timestamp: number;
	content: string;
	avatar_url?: string | null;
	display_recipient?: string;
};

export type Subscription = {
	stream_id: number;
	name: string;
	description: string;
	date_created: number;
	is_muted: boolean;
};
