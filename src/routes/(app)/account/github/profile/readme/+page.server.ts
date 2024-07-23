import { GH_ERR_REDIRECT_PATH, GH_USER_API } from '$lib/constants.js';
import type { GitUser } from '$lib/types/git.js';
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

	const repoResp = await fetch(
		`https://raw.githubusercontent.com/imkuldeepahlawat/imkuldeepahlawat/main/README.md`,
		{
			headers: {
				Authorization: `token ${ghAccessToken}`
			}
		}
	);
	const repo = await repoResp.text();

	return {
		repo
	};
}
