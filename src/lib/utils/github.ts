/**
 * Fetch github repos
 */

export async function fetchRepos(reposUrl: string, token?: string) {
	let repos: any[] = [];
	let page = 1;
	let url = `${reposUrl}?per_page=100&page=${page}&direction=desc&sort=updated`;
	const authHeader: any = token
		? {
				Authorization: `Bearer ${token}`
			}
		: {};
	while (true) {
		let resp = await fetch(url, {
			headers: {
				...authHeader
			}
		});

		if (!resp.ok) break;

		let data: any[] = await resp.json();
		if (data.length === 0) break;
		repos = [...repos, ...data];
		page = page + 1;
		url = `${reposUrl}?per_page=100&page=${page}&direction=desc&sort=updated`;
	}

	return repos;
}

/**
 * find all languages used in repos
 */

export function fetchUniqueGithubLanguage(repos: any[]) {
	const languages = repos.map((repo) => repo.language).filter(Boolean);
	const uniqueLanguages = new Set(languages);
	return Array.from(uniqueLanguages);
}
