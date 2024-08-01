import type { ZulipMessage } from '$lib/types/zulip.js';

export async function load({ url }) {
	const anchor = 'newest'; // You can also use a specific message ID
	const numBefore = 100; // Number of messages before the anchor to fetch
	const numAfter = 0; // Number of messages after the anchor to fetch

	const domain = url.searchParams.get('domain');
	const email = url.searchParams.get('email');
	const apiKey = url.searchParams.get('apiKey');

	const authHeader = 'Basic ' + btoa(email + ':' + apiKey);
	try {
		const response = await fetch(
			`${domain}/api/v1/messages?anchor=${anchor}&num_before=${numBefore}&num_after=${numAfter}`,
			{
				method: 'GET',
				headers: {
					Authorization: authHeader
				}
			}
		);
		const data = await response.json();
		return { messages: data.messages as ZulipMessage[] };
	} catch (error: any) {
		console.log('Error....', error.message);
	}
}
