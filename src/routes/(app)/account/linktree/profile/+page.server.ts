import { scrapeLinktreeAccount } from 'linktree-parser';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	const username = url.searchParams.get('username');
	if (!username) throw redirect(302, '/account/linktree');
	const { account, error } = await scrapeLinktreeAccount(username);

	if (error || !account) {
		throw redirect(302, '/account/linktree');
	}

	return {
		account
	};
}
