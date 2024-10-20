import { error } from '@sveltejs/kit';

export async function GET(event) {
	const link = event.url.searchParams.get('url');
	if (!link) error(400, { message: 'Link is missing' });

	const url = new URL(link);

	const response = await fetch(url);
	const html = await response.text();

	return new Response(JSON.stringify(html));
}
