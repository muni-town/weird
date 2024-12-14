import { env } from '$env/dynamic/private';
import { validateEvent } from '@polar-sh/sdk/webhooks';

import { billing } from '$lib/billing';
import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate webhook signature
		const body = await request.text();
		const headers: Record<string, string> = {};
		for (const [key, value] of request.headers.entries()) {
			headers[key] = value;
		}

		const event = validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET);

		await billing.handleWebhook(event);
	} catch (e) {
		console.error('Error handling polar webhook', e);
		return new Response(null, { status: 500 });
	}
	return new Response(null, { status: 200 });
};
