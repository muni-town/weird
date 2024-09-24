import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	// Redirect home page to the `/members` page for now.
	const redirectUrl = new URL(url);
	redirectUrl.pathname = '/members';
	return new Response(undefined, {
		status: 303,
		statusText: 'See /members page',
		headers: [['Location', redirectUrl.toString()]]
	});
};
