export type ZulipMessage = {
	id: number;
	sender_full_name: string;
	sender_email: string;
	timestamp: number;
	content: string;
	avatar_url?: string | null;
	display_recipient?: string;
};
