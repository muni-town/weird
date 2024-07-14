import { GH_BASE_URL, GH_ERR_REDIRECT_PATH, GH_USER_API } from '$lib/constants.js';
import type { GitUser } from '$lib/types/git';
import { fetchRepos, fetchUniqueGithubLanguage } from '$lib/utils';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
	const ghAccessToken = cookies.get('gh_access_token');

	const userResponse = await fetch(GH_USER_API, {
		headers: {
			Authorization: `token ${ghAccessToken}`
		}
	});

	if (!userResponse.ok) {
		throw redirect(302, GH_ERR_REDIRECT_PATH);
	}

	const userData: GitUser = await userResponse.json();
	const reposUrl = `${GH_BASE_URL}/users/${userData.login}/repos`;

	const reposData = await fetchRepos(reposUrl, ghAccessToken);
	const languages = fetchUniqueGithubLanguage(reposData);

	return {
		repos: reposData,
		languages,
		user: userData
	};
}
