import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
import * as lemon from '@lemonsqueezy/lemonsqueezy.js';
import { redis } from './redis';
import { unsubscribeUser } from './leaf/profile';

const REDIS_SUBSCRIPTIONS_PREFIX = 'weird:billing:lemon:subscriptions:';
const REDIS_FREE_TRIALS_PREFIX = 'weird:billing:free_trials:';

type WebhookEventKind =
	| 'order_created'
	| 'order_refunded'
	| 'subscription_created'
	| 'subscription_updated'
	| 'subscription_cancelled'
	| 'subscription_resumed'
	| 'subscription_expired'
	| 'subscription_paused'
	| 'subscription_unpaused'
	| 'subscription_payment_success'
	| 'subscription_payment_failed'
	| 'subscription_payment_recovered'
	| 'subscription_payment_refunded'
	| 'license_key_created'
	| 'license_key_updated';

type WebhookPayloadKind<Kind extends WebhookEventKind, Data extends { data: any }> = {
	meta: {
		event_name: Kind;
		custom_data?: Record<string, string>;
	};
	data: Data['data'];
};
type WebhookPayload =
	| WebhookPayloadKind<'order_created', lemon.Order>
	| WebhookPayloadKind<'order_refunded', lemon.Order>
	| WebhookPayloadKind<'subscription_created', lemon.Subscription>
	| WebhookPayloadKind<'subscription_updated', lemon.Subscription>
	| WebhookPayloadKind<'subscription_cancelled', lemon.Subscription>
	| WebhookPayloadKind<'subscription_resumed', lemon.Subscription>
	| WebhookPayloadKind<'subscription_expired', lemon.Subscription>
	| WebhookPayloadKind<'subscription_paused', lemon.Subscription>
	| WebhookPayloadKind<'subscription_unpaused', lemon.Subscription>
	| WebhookPayloadKind<'subscription_payment_success', lemon.Subscription>
	| WebhookPayloadKind<'subscription_payment_failed', lemon.Subscription>
	| WebhookPayloadKind<'subscription_payment_recovered', lemon.Subscription>
	| WebhookPayloadKind<'subscription_payment_refunded', lemon.Subscription>
	| WebhookPayloadKind<'license_key_created', lemon.LicenseKey>
	| WebhookPayloadKind<'license_key_updated', lemon.LicenseKey>;

export type SubscriptionInfo = {
	id: string;
	attributes: Omit<lemon.Subscription['data']['attributes'], 'urls'>;
};
export type UserSubscriptionInfo = {
	rauthyId: string;
	subscriptions: SubscriptionInfo[];
	freeTrialExpirationDate?: number;
	isSubscribed: boolean;
};

class BillingEngine {
	constructor() {
		lemon.lemonSqueezySetup({
			apiKey: env.LEMONSQUEEZY_API_KEY,
			onError: (e) => {
				console.error('LemonSqueezy.js error:', e);
			}
		});
	}

	async getWeirdNerdCheckoutLink(userEmail: string, rauthyId: string): Promise<string> {
		const checkout = await lemon.createCheckout(
			env.LEMONSQUEEZY_STORE_ID,
			env.LEMONSQUEEZY_WEIRD_NERD_VARIANT_ID,
			{
				checkoutOptions: { embed: true },
				checkoutData: {
					email: userEmail,
					discountCode: 'WEIRD1',
					custom: {
						rauthyId
					}
				},
				productOptions: {
					redirectUrl: pubenv.PUBLIC_URL + '/my-profile'
				}
			}
		);

		if (checkout.data) {
			return checkout.data.data.attributes.url;
		} else {
			throw `Error creating checkout link: ${checkout.error}`;
		}
	}

	async getSubscriptionInfo(rauthyId: string): Promise<UserSubscriptionInfo> {
		const subscriptions: SubscriptionInfo[] = [];

		const prefix = REDIS_SUBSCRIPTIONS_PREFIX + rauthyId + ':';
		for await (const key of redis.scanIterator({
			MATCH: prefix + '*'
		})) {
			const s = await redis.get(key);
			if (!s) throw `Subscription not found at ${key} in redis.`;
			subscriptions.push(JSON.parse(s));
		}

		const timestamp = await redis.get(REDIS_FREE_TRIALS_PREFIX + rauthyId);
		let freeTrialExpirationDate = timestamp ? parseInt(timestamp) : undefined;

		if (freeTrialExpirationDate && Date.now() > freeTrialExpirationDate) {
			freeTrialExpirationDate = undefined;

			if (!subscriptions.find((sub) => sub.attributes.status != 'expired')) {
				await unsubscribeUser(rauthyId);
				await redis.del(REDIS_FREE_TRIALS_PREFIX + rauthyId);
			}
		}

		let info = {
			subscriptions,
			rauthyId,
			freeTrialExpirationDate
		};

		let isSubscribed =
			info &&
			((info.freeTrialExpirationDate && info.freeTrialExpirationDate > Date.now()) ||
				!!info.subscriptions.find((sub) => sub.attributes.status != 'expired'));

		return { ...info, isSubscribed };
	}

	async getBillingMethodUpdateLink(rauthyId: string): Promise<string | undefined> {
		// Check for subscriptions for this user
		const info = await this.getSubscriptionInfo(rauthyId);
		if (info.subscriptions.length > 0) {
			// Get the subscription ID
			let subscriptionId = info.subscriptions[0].id;
			// Get an up-to-date reference to the subscription, which will include a signed customer
			// portal URL.
			const upToDateSubscription = await lemon.getSubscription(subscriptionId);
			if (upToDateSubscription.data) {
				return upToDateSubscription.data.data.attributes.urls.update_payment_method;
			}
		}
	}

	async cancelBillingSubscription(rauthyId: string) {
		const info = await this.getSubscriptionInfo(rauthyId);
		const activeSubscriptions = info.subscriptions.filter((x) => x.attributes.status == 'active');
		if (activeSubscriptions.length != 1) {
			throw 'Could not find exactly one subscription, not sure how to cancel.';
		}
		const resp = await lemon.cancelSubscription(activeSubscriptions[0].id);
		if (resp.error) {
			console.error(`Error cancelling lemonsqueezy subscription: ${resp.error}`);
		}
	}

	async resumeBillingSubscription(rauthyId: string) {
		const info = await this.getSubscriptionInfo(rauthyId);
		const cancelledSubscriptions = info.subscriptions.filter(
			(x) => x.attributes.status == 'cancelled'
		);
		if (cancelledSubscriptions.length != 1) {
			throw 'More than one cancelled subscription, not sure how to cancel.';
		}
		const resp = await lemon.updateSubscription(cancelledSubscriptions[0].id, { cancelled: false });
		if (resp.error) {
			console.error(`Error resuming lemonsqueezy subscription: ${resp.error}`);
		}
	}

	async #updateSubscriptionInfo(rauthyId: string, subscription: lemon.Subscription['data']) {
		if (subscription.type == 'subscriptions') {
			const info: SubscriptionInfo = {
				id: subscription.id,
				attributes: { ...subscription.attributes, ...{ urls: undefined } }
			};

			const subscriptionKey = REDIS_SUBSCRIPTIONS_PREFIX + rauthyId + ':' + subscription.id;

			const previous = await redis.get(subscriptionKey);
			await redis.set(subscriptionKey, JSON.stringify(info));

			if (previous) {
				const previousSubscriptionInfo: SubscriptionInfo = JSON.parse(previous);
				if (
					previousSubscriptionInfo.attributes.status != 'expired' &&
					info.attributes.status == 'expired'
				) {
					await unsubscribeUser(rauthyId);
				}
			}
		}
	}

	async handleWebhook(webhook: WebhookPayload) {
		if (webhook.meta.event_name.startsWith('subscription_')) {
			// WARNING: this is unintuitive, but apparently lemonsqueezy converts our custom
			// metadata to snake case. Watch out!
			const rauthyId = webhook.meta.custom_data?.['rauthy_id'];
			const data = webhook.data as lemon.Subscription['data'];
			if (!rauthyId) throw 'rauthyId metadata missing from webhook.';
			await this.#updateSubscriptionInfo(rauthyId, data);
		}
	}
}

export const billing = new BillingEngine();
