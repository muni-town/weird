import type { Subscription, ZulipMessage } from '$lib/types/zulip.js';

export async function load({ url }) {
	const anchor = 'newest'; // You can also use a specific message ID
	const numBefore = 100; // Number of messages before the anchor to fetch
	const numAfter = 0; // Number of messages after the anchor to fetch

	const domain = url.searchParams.get('domain');
	const email = url.searchParams.get('email');
	const apiKey = url.searchParams.get('apiKey');

	const authHeader = 'Basic ' + btoa(email + ':' + apiKey);
	try {
		const msgResp = await fetch(
			`${domain}/api/v1/messages?anchor=${anchor}&num_before=${numBefore}&num_after=${numAfter}`,
			{
				method: 'GET',
				headers: {
					Authorization: authHeader
				}
			}
		);
		const msgRespData = await msgResp.json();

		const subscribedChannelResp = await fetch(`${domain}/api/v1/users/me/subscriptions`, {
			method: 'GET',
			headers: {
				Authorization: authHeader
			}
		});
		const subscribedChannelData = await subscribedChannelResp.json();
		return {
			messages: msgRespData.messages as ZulipMessage[],
			subscriptions: subscribedChannelData?.subscriptions as Subscription[]
		};
	} catch (error: any) {
		console.log('Error....', error.message);
	}
}
