import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
import { Polar } from '@polar-sh/sdk';
import type { Subscription } from '@polar-sh/sdk/models/components';
import type { validateEvent } from '@polar-sh/sdk/webhooks';

import { redis } from './redis';
import { applyProfileBenefits as updateUserSubscriptionBenefits } from './leaf/profile';
import { z } from 'zod';

const benefitType = z.enum(['custom_domain', 'non_numbered_username']);
export type Benefit = z.infer<typeof benefitType>;

type WebhookEvent = ReturnType<typeof validateEvent>;

const REDIS_SUBSCRIPTIONS_PREFIX = 'weird:billing:polar:subscriptions:';
const REDIS_FREE_TRIALS_PREFIX = 'weird:billing:free_trials:';

var isoDateRegex =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
function parseJsonDates(_key: string, value: any) {
	if (typeof value === 'string') {
		var a = isoDateRegex.exec(value);
		if (a) return new Date(value);
	}
	return value;
}

function serializeSubscription(sub: Subscription): string {
	return JSON.stringify(sub);
}
function deserializeSubscription(data: string): Subscription {
	return JSON.parse(data, parseJsonDates);
}

export type UserSubscriptionInfo = {
	rauthyId: string;
	subscriptions: Subscription[];
	benefits: Set<Benefit>;
	freeTrialExpirationDate?: number;
	isSubscribed: boolean;
};

class BillingEngine {
	polar: Polar;

	constructor() {
		this.polar = new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: env.POLAR_ENV == 'production' ? 'production' : 'sandbox'
		});
	}

	async getCheckoutLink(userEmail: string, rauthyId: string): Promise<string> {
		const checkout = await this.polar.checkouts.custom.create({
			productPriceId: env.POLAR_SUBSCRIPTION_PRICE_ID,
			customerEmail: userEmail,
			metadata: {
				rauthyId
			},
			allowDiscountCodes: true,
			discountId: env.POLAR_AUTO_DISCOUNT_ID,
			successUrl: pubenv.PUBLIC_URL + `/order-confirmation`
		});

		return checkout.url;
	}

	async getSubscriptionInfo(rauthyId: string): Promise<UserSubscriptionInfo> {
		const subscriptions: Subscription[] = [];

		const prefix = REDIS_SUBSCRIPTIONS_PREFIX + rauthyId + ':';
		for await (const key of redis.scanIterator({
			MATCH: prefix + '*'
		})) {
			const s = await redis.get(key);
			if (!s) throw `Subscription not found at ${key} in redis.`;
			subscriptions.push(deserializeSubscription(s));
		}

		const benefits: Set<Benefit> = new Set();

		// Get benefits according to polar
		for (const sub of subscriptions) {
			if (!sub.endedAt) {
				benefits.add('non_numbered_username');
				benefits.add('custom_domain');

				// TODO: do something like this to read benefits from Polar API ( not working right now for some reason )
				// for (const benefit of sub.product.benefits) {
				// 	switch (benefit.id) {
				// 		case env.POLAR_USERNAME_WITHOUT_NUMBER_ENDING_BENEFIT_ID:
				// 			benefits.add('non_numbered_username');
				// 			break;
				// 		case env.POLAR_CUSTOM_DOMAIN_BENEFIT_ID:
				// 			benefits.add('custom_domain');
				// 			break;
				// 	}
				// }
			}
		}

		// Get benefits from free trial
		const timestamp = await redis.get(REDIS_FREE_TRIALS_PREFIX + rauthyId);
		let freeTrialExpirationDate = timestamp ? parseInt(timestamp) : undefined;

		// If the free trial has expired, update the user benefits and remove the trial
		if (freeTrialExpirationDate && Date.now() > freeTrialExpirationDate) {
			freeTrialExpirationDate = undefined;
			await updateUserSubscriptionBenefits(rauthyId, benefits);
			await redis.del(REDIS_FREE_TRIALS_PREFIX + rauthyId);
		} else if (freeTrialExpirationDate) {
			// If they've got a free trial, add its benefits
			benefits.add('custom_domain');
			benefits.add('non_numbered_username');
		}

		return {
			benefits,
			freeTrialExpirationDate,
			rauthyId,
			subscriptions,
			isSubscribed: !!subscriptions.find((s) => !s.endedAt)
		};
	}

	// async getBillingMethodUpdateLink(rauthyId: string): Promise<string | undefined> {
	// 	throw 'TODO';
	// 	// // Check for subscriptions for this user
	// 	// const info = await this.getSubscriptionInfo(rauthyId);
	// 	// if (info.subscriptions.length > 0) {
	// 	// 	// Get the subscription ID
	// 	// 	let subscriptionId = info.subscriptions[0].id;
	// 	// 	// Get an up-to-date reference to the subscription, which will include a signed customer
	// 	// 	// portal URL.
	// 	// 	const upToDateSubscription = await lemon.getSubscription(subscriptionId);
	// 	// 	if (upToDateSubscription.data) {
	// 	// 		return upToDateSubscription.data.data.attributes.urls.update_payment_method;
	// 	// 	}
	// 	// }
	// }

	// async cancelBillingSubscription(rauthyId: string) {
	// 	throw 'TODO';
	// 	// const info = await this.getSubscriptionInfo(rauthyId);
	// 	// const activeSubscriptions = info.subscriptions.filter((x) => x.attributes.status == 'active');
	// 	// if (activeSubscriptions.length != 1) {
	// 	// 	throw 'Could not find exactly one subscription, not sure how to cancel.';
	// 	// }
	// 	// const resp = await lemon.cancelSubscription(activeSubscriptions[0].id);
	// 	// if (resp.error) {
	// 	// 	console.error(`Error cancelling lemonsqueezy subscription: ${resp.error}`);
	// 	// }
	// }

	// async resumeBillingSubscription(rauthyId: string) {
	// 	throw 'TODO';
	// 	// const info = await this.getSubscriptionInfo(rauthyId);
	// 	// const cancelledSubscriptions = info.subscriptions.filter(
	// 	// 	(x) => x.attributes.status == 'cancelled'
	// 	// );
	// 	// if (cancelledSubscriptions.length != 1) {
	// 	// 	throw 'More than one cancelled subscription, not sure how to cancel.';
	// 	// }
	// 	// const resp = await lemon.updateSubscription(cancelledSubscriptions[0].id, { cancelled: false });
	// 	// if (resp.error) {
	// 	// 	console.error(`Error resuming lemonsqueezy subscription: ${resp.error}`);
	// 	// }
	// }

	async #updateSubscriptionInfo(rauthyId: string, subscription: Subscription) {
		const subscriptionKey = REDIS_SUBSCRIPTIONS_PREFIX + rauthyId + ':' + subscription.id;
		await redis.set(subscriptionKey, serializeSubscription(subscription));

		// Make sure the user's benefits are updated in case they have changed.
		await updateUserSubscriptionBenefits(
			rauthyId,
			(await this.getSubscriptionInfo(rauthyId)).benefits
		);
	}

	async handleWebhook(webhook: WebhookEvent) {
		if (webhook.type == 'subscription.updated') {
			const subscription = webhook.data;
			const rauthyId = subscription.metadata['rauthyId'] as string;
			if (!rauthyId) {
				console.error(
					`Polar webhook handling error: rauthyId missing from order metadata. Subscription ID: ${subscription.id}`
				);
				return;
			}
			this.#updateSubscriptionInfo(rauthyId, subscription);
		}
	}

	async grantFreeTrial(rauthyId: string, expires: Date) {
		await redis.set(REDIS_FREE_TRIALS_PREFIX + rauthyId, expires.getTime().toString());
	}

	async cancelFreeTrial(rauthyId: string) {
		await redis.del(REDIS_FREE_TRIALS_PREFIX + rauthyId);
		const subscriptionInfo = await this.getSubscriptionInfo(rauthyId);
		await updateUserSubscriptionBenefits(rauthyId, subscriptionInfo.benefits);
	}

	/** Checks whether or not the subscription associated to a checkout has been received over the
	 * webhook. */
	async checkoutSubscriptionIsReady(checkoutId: string): Promise<boolean> {
		const checkout = await this.polar.checkouts.custom.get({ id: checkoutId });

		const rauthyId = checkout.metadata.rauthyId;
		if (typeof rauthyId != 'string') return false;

		const info = await this.getSubscriptionInfo(rauthyId);

		return !!info.subscriptions.find((s) => s.checkoutId == checkoutId);
	}
}

export const billing = new BillingEngine();
