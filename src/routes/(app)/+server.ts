import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	const redirectUrl = new URL(url);
	redirectUrl.pathname = '/members';
	return new Response(undefined, {
		status: 303,
		statusText: 'See /members page',
		headers: [['Location', redirectUrl.toString()]]
	});
};
