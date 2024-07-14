import { CODEBERG_ERR_REDIRECT_PATH, CODEBERG_URI, CODEBERG_USER_API } from '$lib/constants.js';
import type { GitRepo, GitUser } from '$lib/types/git.js';
import { fetchRepos, fetchUniqueGithubLanguage } from '$lib/utils.js';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const username = event.url.searchParams.get('username') as string;
	if (!username) {
		throw redirect(302, CODEBERG_ERR_REDIRECT_PATH);
	}
	const userResp = await fetch(`${CODEBERG_USER_API}/${username}`);
	if (!userResp.ok) {
		return {
			error: 'User not found'
		};
	}
	const userData = await userResp.json();

	const transformUser: GitUser = {
		...userData,
		bio: userData.description,
		followers: userData.following_count,
		following: userData.followers_count,
		name: userData.full_name
	};

	const reposUrl = `${CODEBERG_URI}/api/v1/users/${username}/repos`;
	const reposData = await fetchRepos(reposUrl);
	const languages = fetchUniqueGithubLanguage(reposData);

	const transformRepos: GitRepo[] = reposData.map((repo) => ({
		...repo,
		visibility: repo.private ? 'Private' : 'Public',
		stargazers_count: repo.stars_count
	}));

	return {
		user: transformUser,
		repos: transformRepos,
		languages
	};
}
