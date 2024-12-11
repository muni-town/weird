<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { UserSubscriptionInfo } from '$lib/billing';
	import { genRandomUsernameSuffix } from '$lib/usernames/client';
	import Icon from '@iconify/svelte';

	const {
		error,
		action,
		subscriptionInfo
	}: {
		error: string | undefined;
		action: string;
		subscriptionInfo: UserSubscriptionInfo;
	} = $props();

	let handle = $state('');
	let randomNumberSuffix = $state(genRandomUsernameSuffix());
	let fullHandleSuffix = $derived(
		(subscriptionInfo?.isSubscribed ? '' : randomNumberSuffix) + '.' + env.PUBLIC_USER_DOMAIN_PARENT
	);
	let handleWithSuffix = $derived(
		subscriptionInfo?.isSubscribed ? handle : handle + randomNumberSuffix
	);
</script>

<form class="card m-8 flex max-w-[40em] flex-col gap-4 p-6" method="post" {action}>
	<h1 class="text-2xl font-bold">Claim Handle</h1>

	{#if error}
		<aside class="alert variant-ghost-error w-80">
			<div class="alert-message">
				<p>{error}</p>
			</div>
		</aside>
	{/if}

	<p>Choose a handle for your Weird profile! You will be able to change this later.</p>

	{#if !subscriptionInfo?.isSubscribed}
		<p class="text- flex items-center gap-3 pb-4 text-secondary-200">
			<Icon icon="material-symbols:error-outline" font-size={40} /> Your handle will end with a random
			4 digit number. Having a Weird subscription allows you to choose a name without the number.
		</p>
	{/if}

	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim">@</div>
		<input placeholder="handle" bind:value={handle} />
		<input type="hidden" name="username" value={handleWithSuffix} />
		<div class="input-group-shim">
			{fullHandleSuffix}
		</div>
	</div>
	<button class="variant-ghost btn">Claim</button>
</form>
