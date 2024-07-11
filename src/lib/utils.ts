import { env } from '$env/dynamic/public';
import type { SessionInfo, UserInfo } from './rauthy';
import type { GithubRepo } from './types/github';

export interface CheckResponseError {
	status: number;
	statusText: string;
	data: string;
}

/** Throw an exception if the response is not OK. */
export async function checkResponse(response: Response | Promise<Response>): Promise<Response> {
	const resp = response instanceof Promise ? await response : response;
	if (!resp.ok) {
		throw {
			status: resp.status,
			statusText: resp.statusText,
			data: await resp.text()
		};
	}
	return resp;
}

export interface Username {
	name: string;
	domain?: string;
}

/**
 * Parse a usernme in the format `user@domain` or `user`, and return the name and the domain.
 */
export function parseUsername(username: string): Username {
	if (username.includes('@')) {
		const split = username.split('@');
		return {
			name: split[0],
			domain: split[1]
		};
	} else {
		return {
			name: username
		};
	}
}

/**
 * Fetch github repos
 */

export async function fetchRepos(username: string, token?: string) {
	let repos = [] as GithubRepo[];
	let page = 1;
	let url = `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&direction=desc&sort=updated`;

	while (true) {
		let resp = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		if (!resp.ok) break;

		let data: GithubRepo[] = await resp.json();
		if (data.length === 0) break;
		repos = [...repos, ...data];
		page = page + 1;
		url = `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&direction=desc&sort=updated`;
	}

	return repos;
}

/**
 * find all languages used in repos
 */

export function fetchUniqueGithubLanguage(repos: GithubRepo[]) {
	const languages = repos.map((repo) => repo.language).filter(Boolean);
	const uniqueLanguages = new Set(languages);
	return Array.from(uniqueLanguages);
}
