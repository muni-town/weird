export type GitRepo = {
	id: number;
	name: string;
	description: string | null;
	language: string | null;
	visibility: string;
	stargazers_count: number;
	forks_count: number;
	html_url: string;
};

export type GitUser = {
	id: number;
	login: string;
	avatar_url: string | null;
	html_url: string;
	name?: string | null;
	company?: string | null;
	blog?: string | null;
	location?: string | null;
	email: string | null;
	bio: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	twitter_username: string | null;
};
