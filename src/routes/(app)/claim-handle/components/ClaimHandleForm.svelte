<script lang="ts">
	import type { UserSubscriptionInfo } from '$lib/billing';
	import { usernames } from '$lib/usernames/client';
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
	$effect(() => {
		const lowercase = handle.toLowerCase();
		if (lowercase != handle) handle = lowercase;
	});
	let randomNumberSuffix = $state(usernames.genRandomUsernameSuffix());
	let publicSuffix = $state(usernames.defaultSuffix());
	let fullHandleSuffix = $derived(
		(subscriptionInfo.benefits.has('non_numbered_username') ? '' : randomNumberSuffix) +
			'.' +
			publicSuffix
	);
	let handleWithNumber = $derived(
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
		<input type="hidden" name="username" value={handleWithNumber} />
		<input type="hidden" name="suffix" value={publicSuffix} />
		<div class="input-group-shim">
			{subscriptionInfo.benefits.has('non_numbered_username') ? '' : randomNumberSuffix}
			<select bind:value={publicSuffix} class="pl-0">
				{#each usernames.publicSuffixes() as suffix}
					<option value={suffix}>.{suffix}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="py-1 text-center"><code>{handle || '[handle]'}{fullHandleSuffix}</code></div>
	<button class="variant-ghost btn">Claim</button>
</form>
