import { error } from '@sveltejs/kit';

export async function GET({ url, fetch }) {
	const link = url.searchParams.get('url');
	if (!link) error(400, { message: 'Link is missing' });
	try {
		const resp = await fetch(link);
		console.log(resp);
		if (resp.ok) {
			const text = await resp.text();
			return new Response(text);
		}
		return error(500, { message: 'Error fetching URL' });
	} catch (e) {
		return error(500, { message: 'Error fetching URL' });
	}
}
