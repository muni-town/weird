import { scrapeLinktreeProfile } from '$lib/linktree.js';
import { redirect } from '@sveltejs/kit';
import fs from 'fs';
export async function load({ url }) {
	const username = url.searchParams.get('username');
	if (!username) throw redirect(302, '/account/linktree');
	const account = await scrapeLinktreeProfile(username);

	if (!account) {
		throw redirect(302, '/account/linktree');
	}

	return {
		account
	};
}
