export type GithubRepo = {
	id: number;
	name: string;
	description: string | null;
	language: string;
	visibility: string;
	stargazers_count: number;
	forks_count: number;
	html_url: string;
};

export type GithubUser = {
	login: string;
	avatar_url: string | null;
	html_url: string;
	repos_url: string;
	name: string;
	company: string | null;
	blog: string | null;
	location: string | null;
	email: string | null;
	bio: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	twitter_username: string | null;
};
