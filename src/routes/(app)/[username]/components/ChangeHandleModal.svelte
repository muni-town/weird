<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';

	// Stores
	import { getModalStore, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { env } from '$env/dynamic/public';
	import { validUsernameRegex } from '$lib/usernames/client';

	// Props
	/** Exposes parent props to this component. */
	const { parent }: { parent: SvelteComponent } = $props();

	const modalStore = getModalStore();

	// Form Data
	let handle = $state('');
	let tabSet = $state(0);
	let valid = $derived(!!handle.match(validUsernameRegex));

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		if ($modalStore[0].response) $modalStore[0].response({ ok: handle });
		modalStore.close();
	}

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4 min-h-[20em] flex flex-col justify-between';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'p-4';

	let input: HTMLInputElement = $state(null as any);
	onMount(() => input.focus());
</script>

{#if $modalStore[0]}
	<div class={cBase}>
		<div>
			<header class={cHeader}>Set Handle</header>

			<TabGroup>
				<Tab bind:group={tabSet} name="weird" value={0}>Automatic</Tab>
				<Tab bind:group={tabSet} name="custom" value={1}>Custom</Tab>
				<svelte:fragment slot="panel">
					{#if tabSet === 0}
						<form class="modal-form {cForm}">
							<label class="label">
								<span>Handle</span>

								<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
									<div class="input-group-shim">@</div>
									<input
										type="text"
										bind:this={input}
										bind:value={handle}
										placeholder="name"
									/>
									<div class="input-group-shim">.{env.PUBLIC_USER_DOMAIN_PARENT}</div>
								</div>
							</label>
						</form>
					{:else if tabSet === 1}
						Comming soon!
					{/if}
				</svelte:fragment>
			</TabGroup>
		</div>

		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" onclick={parent.onClose}
				>{parent.buttonTextCancel}</button
			>
			<button class="btn {parent.buttonPositive}" onclick={onFormSubmit} disabled={!valid}
				>Save</button
			>
		</footer>
	</div>
{/if}
