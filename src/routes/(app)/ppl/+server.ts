import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	// Redirect home page to the `/people` page for now.
	const redirectUrl = new URL(url);
	redirectUrl.pathname = '/people';
	return new Response(undefined, {
		status: 303,
		statusText: 'See /people page',
		headers: [['Location', redirectUrl.toString()]]
	});
};
