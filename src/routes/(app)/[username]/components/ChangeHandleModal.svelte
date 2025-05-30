<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';

	// Stores
	import { getModalStore, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { env } from '$env/dynamic/public';
	import { usernames } from '$lib/usernames/client';
	import { goto } from '$app/navigation';
	import type { UserSubscriptionInfo } from '$lib/billing';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	// Props
	/** Exposes parent props to this component. */
	const { parent }: { parent: SvelteComponent } = $props();

	const modalStore = getModalStore();

	let subscriptionInfo = $state({ rauthyId: '', benefits: new Set() }) as UserSubscriptionInfo;
	$effect(() => {
		subscriptionInfo = ($modalStore[0] as any).subscriptionInfo;
	});

	let selectedTab = $state(0);
	let handle = $state('');
	$effect(() => {
		const lowercase = handle.toLowerCase();
		if (lowercase != handle) handle = lowercase;
	});
	let domain = $state('');
	let error = $state(null) as null | string;
	let publicSuffix = $state(usernames.defaultSuffix());
	let verifying = $state(false);
	let valid = $derived(
		selectedTab == 0
			? !!handle.match(usernames.validUsernameRegex)
			: !!domain.match(usernames.validDomainRegex) && subscriptionInfo.benefits.has('custom_domain')
	);
	let randomNumberSuffix = $state(usernames.genRandomUsernameSuffix());
	let fullUsernameSuffix = $derived(
		(subscriptionInfo.benefits.has('non_numbered_username') ? '' : randomNumberSuffix) +
			'.' +
			publicSuffix
	);
	let handleWithSuffix = $derived(
		handle + (subscriptionInfo.benefits.has('non_numbered_username') ? '' : randomNumberSuffix)
	);

	// We've created a custom submit function to pass the response and close the modal.
	async function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (selectedTab == 0) {
			const resp = await fetch(`/${$page.params.username}/settings/setHandle`, {
				method: 'post',
				body: JSON.stringify({ username: handleWithSuffix, suffix: publicSuffix }),
				headers: [['content-type', 'application/json']]
			});

			const respData: { username: string } | { error: string } = await resp.json();

			if ('error' in respData) {
				if ($modalStore[0].response) $modalStore[0].response({ error: respData.error });
			} else {
				if ($modalStore[0].response) $modalStore[0].response({ ok: true });
				await goto(`/${respData.username}`);
			}

			modalStore.close();
		} else if (selectedTab == 1) {
			verifying = true;

			const resp = await fetch(`/${$page.params.username}/settings/setHandle`, {
				method: 'post',
				body: JSON.stringify({ domain, verifyInQueue: true }),
				headers: [['content-type', 'application/json']]
			});

			const respData: { domain: string } | { error: string } = await resp.json();

			if ('error' in respData) {
				await goto(`/${$page.params.username}`, { invalidateAll: true });
				modalStore.close();
			} else {
				error = null;
				if ($modalStore[0].response) $modalStore[0].response({ ok: true });
				await goto(`/${respData.domain}`);
				modalStore.close();
			}

			verifying = false;
		}
	}

	async function verify(e: Parameters<MouseEventHandler<HTMLButtonElement>>[0]) {
		e.preventDefault();

		verifying = true;

		const resp = await fetch(`/${$page.params.username}/settings/setHandle`, {
			method: 'post',
			body: JSON.stringify({ domain }),
			headers: [['content-type', 'application/json']]
		});

		const respData: { domain: string } | { error: string } = await resp.json();

		if ('error' in respData) {
			error = respData.error;
		} else {
			error = null;
			if ($modalStore[0].response) $modalStore[0].response({ ok: true });
			await goto(`/${respData.domain}`);
			modalStore.close();
		}

		verifying = false;
	}

	// Base Classes
	const cBase = $derived(
		`card p-4 shadow-xl space-y-4 min-h-[24em] flex flex-col justify-between w-modal`
	);
	const cHeader = 'text-2xl font-bold';

	let input: HTMLInputElement = $state(null as any);
	onMount(() => input.focus());
</script>

{#if $modalStore[0]}
	<form class={cBase} onsubmit={onFormSubmit}>
		<div>
			<header class={cHeader}>Set Handle</header>

			{#if error}
				<aside class="alert variant-ghost-error relative my-4 w-full">
					<div class="alert-message">
						<p><strong>Error:&nbsp;</strong>{error}</p>
						<p>
							<strong>Note: </strong> DNS propagation can take some time, so even if you've set it up
							correctly, you may need to wait for a few minutes or more, depending on your DNS provider,
							before validation will complete successfully.
						</p>
					</div>
				</aside>
			{/if}

			<TabGroup>
				<Tab bind:group={selectedTab} name="weird" value={0}>Automatic</Tab>
				<Tab bind:group={selectedTab} name="custom" value={1}>Custom</Tab>
				<svelte:fragment slot="panel">
					<div class="p-2">
						{#if selectedTab === 0}
							{#if !subscriptionInfo.benefits.has('non_numbered_username')}
								<p class="text- flex items-center gap-3 pb-4 text-secondary-200">
									<Icon icon="material-symbols:error-outline" font-size={40} /> Your handle will end
									with a random 4 digit number. Having a Weird subscription allows you to choose a name
									without the number.
								</p>
							{/if}

							<label class="label">
								<span>Handle</span>

								<!-- TODO: extract this into a component that can be shared with the new user handle
								claim form. -->
								<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
									<div class="input-group-shim">@</div>
									<input type="text" bind:this={input} bind:value={handle} placeholder="name" />
									<div class="input-group-shim">
										{subscriptionInfo.benefits.has('non_numbered_username')
											? ''
											: randomNumberSuffix}
										<select bind:value={publicSuffix} class="pl-0">
											{#each usernames.publicSuffixes() as suffix}
												<option value={suffix}>.{suffix}</option>
											{/each}
										</select>
									</div>
								</div>
							</label>
							<div class="prose-invert mb-3 mt-8">
								<p>
									Claim <code>@{handle ? handle : '[name]'}{fullUsernameSuffix}</code> instantly!
								</p>
								<p class="mt-3">
									If you have your own web domain, you can also <button
										type="button"
										class="underline"
										onclick={() => (selectedTab = 1)}>use that instead</button
									>.
								</p>
							</div>
						{:else if selectedTab === 1}
							{#if !subscriptionInfo.benefits.has('custom_domain')}
								<p class="flex items-center gap-3 pb-4 text-lg text-error-200">
									<Icon icon="material-symbols:error-outline" font-size={40} />
									Setting a custom domain as your handle requires a subscription.
								</p>
							{/if}

							<label class="label">
								<span>Web Domain</span>
								<div class="flex gap-2">
									<input
										class="input"
										type="text"
										bind:value={domain}
										disabled={!subscriptionInfo.benefits.has('custom_domain')}
										placeholder="name.example.com"
									/>
									<button
										type="button"
										class="variant-ghost btn text-sm"
										onclick={verify}
										disabled={!valid || verifying}>Verify</button
									>
								</div>
							</label>

							<div class="prose-invert pt-4">
								{#if valid}
									<p class="mb-3">
										Add the following DNS records to your DNS provider to setup your Weird handle:
									</p>
									{#if domain.split('.').length == 2}
										<aside class="alert variant-ghost-warning mb-4">
											<div class="alert-message">
												<p>
													<strong>Note:</strong> Your DNS provider must support either
													<code>ALIAS</code>
													records or <code>CNAME</code> flattening. If it does not, your domain provider
													is not currently supported, but will be soon.
												</p>
											</div>
										</aside>

										<div class="table-container border-2 border-solid border-surface-200">
											<table class="table table-hover table-compact">
												<thead>
													<tr>
														<th class="!px-4 !py-1"> Type </th>
														<th class="!px-4 !py-1"> Host </th>
														<th class="!px-4 !py-1"> Value </th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>
															<code class="font-mono">ALIAS</code>
															or
															<br />
															<code class="font-mono">CNAME</code>
														</td>
														<td> <pre>@</pre> </td>
														<td> <pre>{env.PUBLIC_DOMAIN}</pre> </td>
													</tr>
													<tr>
														<td>
															<pre>TXT</pre>
														</td>
														<td> <pre>_weird</pre> </td>
														<td> <pre>"subspace={($modalStore[0] as any).subspace}"</pre> </td>
													</tr>
												</tbody>
											</table>
										</div>
									{:else}
										<div class="table-container border-2 border-solid border-surface-200">
											<table class="table table-hover table-compact">
												<thead>
													<tr>
														<th class="!px-4 !py-1"> Type </th>
														<th class="!px-4 !py-1"> Host </th>
														<th class="!px-4 !py-1"> Value </th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>
															<code class="font-mono">CNAME</code>
														</td>
														<td> <pre>{domain.split('.').slice(0, -2).join('.')}</pre> </td>
														<td> <pre>{env.PUBLIC_DOMAIN}</pre> </td>
													</tr>
													<tr>
														<td>
															<pre>TXT</pre>
														</td>
														<td> <pre>_weird.{domain.split('.').slice(0, -2).join('.')}</pre> </td>
														<td> <pre>"subspace={($modalStore[0] as any).subspace}"</pre> </td>
													</tr>
												</tbody>
											</table>
										</div>
									{/if}
								{:else}
									<div class="flex flex-col gap-2">
										<p>
											You can use your own domain as your Weird handle by configuring your DNS
											records.
										</p>
										<p>Enter your domain for specific instructions.</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</svelte:fragment>
			</TabGroup>
		</div>

		<footer class="modal-footer {parent.regionFooter}">
			{#if verifying}
				<div class="ml-4 flex items-center gap-3">Verifying... <ProgressRadial width="w-8" /></div>
			{/if}
			<span class="flex-grow"></span>
			<button class="btn {parent.buttonNeutral}" onclick={parent.onClose} type="button"
				>{parent.buttonTextCancel}</button
			>
			<button class="btn {parent.buttonPositive}" type="submit" disabled={!valid || verifying}
				>Save</button
			>
		</footer>
	</form>
{/if}
