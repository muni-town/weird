<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { format } from 'timeago.js';
	import type { UserSubscriptionInfo } from '$lib/billing';
	import { PolarEmbedCheckout } from '@polar-sh/checkout/embed';
	import { onMount } from 'svelte';

	const modalStore = getModalStore();

	let subscriptionInfo = $state({ rauthyId: '', benefits: new Set() }) as UserSubscriptionInfo;

	onMount(() => {
		PolarEmbedCheckout.init();
	});

	$effect(() => {
		subscriptionInfo = ($modalStore[0] as any).subscriptionInfo as UserSubscriptionInfo;
	});

	async function purchaseSubscription() {
		const checkoutUrl = await (
			await fetch(`/${$page.params.username}/settings/getBillingCheckoutLink`, {
				method: 'post'
			})
		).text();
		window.location.href = checkoutUrl;
	}
	// async function openBillingInfoForm() {
	// 	const checkoutUrl = await (
	// 		await fetch(`/${$page.params.username}/settings/getBillingMethodUpdateLink`, {
	// 			method: 'post'
	// 		})
	// 	).text();
	// 	PolarEmbedCheckout.create(checkoutUrl, 'light');
	// }
	// async function cancelSubscription() {
	// 	await fetch(`/${$page.params.username}/settings/cancelBillingSubscription`, {
	// 		method: 'post'
	// 	});
	// 	window.location.reload();
	// }
	// async function resumeSubscription() {
	// 	await fetch(`/${$page.params.username}/settings/resumeBillingSubscription`, {
	// 		method: 'post'
	// 	});
	// 	window.location.reload();
	// }
</script>

{#if $modalStore[0]}
	<div class="card flex flex-col justify-between space-y-4 p-4 shadow-xl">
		<div>
			<header class="text-2xl font-bold">Manage Subscription</header>

			<div class="p-2">
				{#if subscriptionInfo?.freeTrialExpirationDate && !subscriptionInfo?.isSubscribed}
					<div class="card bg-surface-200-700-token mt-4 drop-shadow-lg">
						<header class="card-header text-xl font-bold">Free Trial</header>
						<section class="prose prose-invert p-4">
							<p>You have access to the following benefits:</p>
							<ul>
								{#if subscriptionInfo.benefits.has('non_numbered_username')}
									<li>Claim a handle that doesn't end in a number.</li>
								{/if}
								{#if subscriptionInfo.benefits.has('custom_domain')}
									<li>Use a custom domain for your handle.</li>
								{/if}
							</ul>
							<p>
								<strong>Trial Expires:</strong>
								{format(subscriptionInfo.freeTrialExpirationDate)}
							</p>
						</section>
					</div>
					<div class="mt-5 flex flex-col items-center gap-4">
						<p class="max-w-[30em]">
							You must purchase a subscription before the trial expires if you wish to keep your
							custom domain or handle.
						</p>
						<button class="variant-ghost btn" onclick={purchaseSubscription}
							>Purchase Subscription</button
						>
					</div>
				{:else if !subscriptionInfo.benefits.size}
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
					<div class="card bg-surface-200-700-token mt-4 drop-shadow-lg">
						<header class="card-header text-xl font-bold">Weird Nerd</header>
						<section class="prose prose-invert p-4">
							<p class="py-3">You have access to the following benefits:</p>
							<ul>
								{#if subscriptionInfo.benefits.has('non_numbered_username')}
									<li>Claim a handle that doesn't end in a number.</li>
								{/if}
								{#if subscriptionInfo.benefits.has('custom_domain')}
									<li>Use a custom domain for your handle.</li>
								{/if}
							</ul>
							<!-- <div>
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
							{/if} -->
						</section>
						<footer class="card-footer flex flex-col gap-2">
							<!-- <button class="variant-ghost btn" onclick={openBillingInfoForm}
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
							-->
							<a class="variant-ghost btn" href="https://polar.sh/login" target="_blank"
								>Login to Polar to Manage Your Subscription</a
							>
						</footer>
					</div>
				{/if}
			</div>
		</div>

		<button class="variant-ghost btn" onclick={() => modalStore.close()}> Close </button>
	</div>
{/if}
