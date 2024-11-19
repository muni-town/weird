<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';

	// Stores
	import { getModalStore, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { env } from '$env/dynamic/public';
	import { validDomainRegex, validUsernameRegex } from '$lib/usernames/client';
	import { goto } from '$app/navigation';

	// Props
	/** Exposes parent props to this component. */
	const { parent }: { parent: SvelteComponent } = $props();

	const modalStore = getModalStore();

	let selectedTab = $state(0);
	let handle = $state('');
	let domain = $state('');
	let error = $state(null) as null | string;
	let verifying = $state(false);
	let valid = $derived(
		selectedTab == 0 ? !!handle.match(validUsernameRegex) : !!domain.match(validDomainRegex)
	);

	// We've created a custom submit function to pass the response and close the modal.
	async function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (selectedTab == 0) {
			const resp = await fetch(`/${handle}/settings/handle`, {
				method: 'post',
				body: JSON.stringify({ username: handle }),
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

			const resp = await fetch(`/${domain}/settings/handle`, {
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
	}

	// Base Classes
	const cBase = $derived(
		`card p-4 shadow-xl space-y-4 min-h-[24em] flex flex-col justify-between ${selectedTab == 0 ? 'w-modal' : 'w-full'}`
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
							<label class="label">
								<span>Handle</span>

								<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
									<div class="input-group-shim">@</div>
									<input type="text" bind:this={input} bind:value={handle} placeholder="name" />
									<div class="input-group-shim">.{env.PUBLIC_USER_DOMAIN_PARENT}</div>
								</div>
							</label>
							<div class="prose-invert mb-3 mt-8">
								<p>
									Claim <code>@{handle ? handle : '[name]'}.{env.PUBLIC_USER_DOMAIN_PARENT}</code> instantly!
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
							<label class="label">
								<span>Web Domain</span>
								<input
									class="input"
									type="text"
									bind:value={domain}
									placeholder="name.example.com"
								/>
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
														<td> <pre>a.weird.one</pre> </td>
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
														<td> <pre>{domain.split('.').slice(0, -2)}</pre> </td>
														<td> <pre>a.weird.one</pre> </td>
													</tr>
													<tr>
														<td>
															<pre>TXT</pre>
														</td>
														<td> <pre>_weird.{domain.split('.').slice(0, -2)}</pre> </td>
														<td> <pre>"subspace={($modalStore[0] as any).subspace}"</pre> </td>
													</tr>
												</tbody>
											</table>
										</div>
									{/if}
								{:else}
									<p>Enter a valid domain for setup instructions.</p>
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
			<button class="btn {parent.buttonPositive}" type="submit" disabled={!valid && !verifying}
				>Save</button
			>
		</footer>
	</form>
{/if}
