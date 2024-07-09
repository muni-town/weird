import { GH_ERR_REDIRECT_URI, GH_USER_API } from '$lib/constants.js';
import type { GithubUser } from '$lib/types/github';
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
		throw redirect(302, GH_ERR_REDIRECT_URI);
	}

	const userData: GithubUser = await userResponse.json();

	const reposData = await fetchRepos(userData.login, ghAccessToken);
	const languages = fetchUniqueGithubLanguage(reposData);

	return {
		repos: reposData,
		languages,
		user: userData
	};
}
