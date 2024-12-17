import { usernames } from '$lib/usernames/index';
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';
import { billing } from '$lib/billing';

export const load: ServerLoad = async ({}) => {
	const users = [];
	for await (const user of usernames.list()) {
		const subscriptionInfo = await billing.getSubscriptionInfo(user.rauthyId);
		users.push({ ...user, subscriptionInfo, subspace: undefined });
	}
	return { users };
};

export const actions = {
	grantFreeTrial: async ({ request }) => {
		const formData = await request.formData();
		const expires = formData.get('expires')?.toString();
		const rauthyId = formData.get('rauthyId')?.toString();
		if (!(expires && rauthyId)) return { error: 'You must fill in all fields' };

		if (rauthyId == '___everyone___') {
			for await (const user of usernames.list()) {
				await billing.grantFreeTrial(user.rauthyId, new Date(expires));
			}
		} else {
			await billing.grantFreeTrial(rauthyId, new Date(expires));
		}

		return { success: `Free trial set` };
	},
	cancelFreeTrial: async ({ request }) => {
		const formData = await request.formData();
		const rauthyId = formData.get('rauthyId')?.toString();
		if (!rauthyId) return { error: 'You must fill in all fields' };

		await billing.cancelFreeTrial(rauthyId);

		return { success: `Free trial deleted.` };
	}
} satisfies Actions;
