<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import type { SubscriptionInfo } from '$lib/billing';
	import { format } from 'timeago.js';

	const modalStore = getModalStore();

	let subscriptionInfo: SubscriptionInfo[] = $state([]);

	$effect(() => {
		subscriptionInfo = ($modalStore[0] as any).subscriptionInfo;
	});

	let hasNonExpired = $derived(
		subscriptionInfo.filter((x) => x.attributes.status != 'expired').length > 0
	);

	async function purchaseSubscription() {
		const checkoutUrl = await (
			await fetch(`/${$page.params.username}/settings/getBillingCheckoutLink`, {
				method: 'post'
			})
		).text();
		window.LemonSqueezy.Url.Open(checkoutUrl);
	}
	async function openBillingInfoForm() {
		const checkoutUrl = await (
			await fetch(`/${$page.params.username}/settings/getBillingMethodUpdateLink`, {
				method: 'post'
			})
		).text();
		window.LemonSqueezy.Url.Open(checkoutUrl);
	}
	async function cancelSubscription() {
		await fetch(`/${$page.params.username}/settings/cancelBillingSubscription`, {
			method: 'post'
		});
		window.location.reload();
	}
	async function resumeSubscription() {
		await fetch(`/${$page.params.username}/settings/resumeBillingSubscription`, {
			method: 'post'
		});
		window.location.reload();
	}
</script>

{#if $modalStore[0]}
	<div class="card flex flex-col justify-between space-y-4 p-4 shadow-xl">
		<div>
			<header class="text-2xl font-bold">Manage Subscription</header>

			<div class="p-2">
				{#if !hasNonExpired}
					<div class="card bg-surface-200-700-token mt-4 drop-shadow-lg">
						<header class="card-header text-xl font-bold">Weird Nerd</header>
						<section class="p-4">Unlock memorable usernames or custom domains!</section>
						<footer class="card-footer flex flex-col gap-2">
							<button class="variant-ghost btn" onclick={purchaseSubscription}
								>Purchase Subscription</button
							>
						</footer>
					</div>
				{:else}
					{#each subscriptionInfo as subscription}
						<div class="card bg-surface-200-700-token mt-4 drop-shadow-lg">
							<header class="card-header text-xl font-bold">
								{subscription.attributes.product_name}
							</header>
							<section class="p-4">
								<div>
									<strong>Status:</strong>
									{subscription.attributes.status_formatted}
								</div>
								{#if subscription.attributes.status == 'cancelled' && subscription.attributes.ends_at}
									<strong>Subscription Ends:</strong>
									{format(subscription.attributes.ends_at)}
								{/if}
								{#if subscription.attributes.status == 'active' && subscription.attributes.renews_at}
									<strong>Renews Automatically:</strong>
									{format(subscription.attributes.renews_at)}
								{/if}
							</section>
							<footer class="card-footer flex flex-col gap-2">
								<button class="variant-ghost btn" onclick={openBillingInfoForm}
									>Update Billing Info</button
								>
								{#if subscription.attributes.status == 'active'}
									<button class="variant-ghost btn" onclick={cancelSubscription}
										>Cancel Subscription</button
									>
								{:else if subscription.attributes.status == 'cancelled'}
									<button class="variant-ghost btn" onclick={resumeSubscription}
										>Resume Subscription</button
									>
								{/if}
							</footer>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<button class="variant-ghost btn" onclick={() => modalStore.close()}> Close </button>
	</div>
{/if}
