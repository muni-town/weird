import { env } from '$env/dynamic/private';
import { billing } from '$lib/billing';
import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'node:crypto';

function validateHmac(secret: string, body: Uint8Array, sig?: string) {
	const hmac = crypto.createHmac('sha256', secret);
	const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
	const signature = Buffer.from(sig || '', 'utf8');

	if (!crypto.timingSafeEqual(digest, signature)) {
		throw new Error('Invalid signature.');
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate webhook signature
		const body = new Uint8Array(await request.arrayBuffer());
		validateHmac(
			env.LEMONSQUEEZY_WEBHOOK_SECRET,
			body,
			request.headers.get('X-Signature') || undefined
		);
		const text = new TextDecoder().decode(body);

		await billing.handleWebhook(JSON.parse(text));
	} catch (e) {
		console.error('Error handling lemonsqueezy webhook', e);
		return new Response(null, { status: 500 });
	}
	return new Response(null, { status: 200 });
};
