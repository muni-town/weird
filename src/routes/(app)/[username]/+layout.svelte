<script lang="ts">
	import { type Snippet } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import SetHandleModal from './components/ChangeHandleModal.svelte';
	import ManageSubscriptionModal from './components/ManageSubscriptionModal.svelte';
	import DeleteProfileModal from './components/DeleteProfileModal.svelte';
	import { goto } from '$app/navigation';

	const { data, children }: { children: Snippet; data: PageData } = $props();

	const modalStore = getModalStore();
	let error: string | null = $state(null);

	const setHandleModal: ModalSettings = $derived({
		type: 'component',
		component: { ref: SetHandleModal },
		subspace: data.subspace,
		subscriptionInfo: data.subscriptionInfo,
		async response(r) {
			if ('error' in r) {
				error = r.error;
			} else {
				error = null;
			}
		}
	});
	const manageSubscriptionModal: ModalSettings = $derived({
		type: 'component',
		component: { ref: ManageSubscriptionModal },
		subscriptionInfo: data.subscriptionInfo,
		async response(r) {
			if ('error' in r) {
				error = r.error;
			} else {
				error = null;
			}
		}
	});
	const deleteProfileModal: ModalSettings = $derived({
		type: 'component',
		component: { ref: DeleteProfileModal },
		async response(r) {
			if ('error' in r) {
				error = r.error;
			} else {
				error = null;
			}
		}
	});

	async function cancelPendingDomainVerification() {
		await fetch(`/${$page.params.username}/settings/cancelDomainVerification`, {
			method: 'post',
			headers: [['content-type', 'application/json']]
		});
		await goto(`/${$page.params.username}`, { invalidateAll: true });
		modalStore.close();
	}
</script>

<div class="flex max-w-full flex-row flex-wrap-reverse justify-center sm:flex-nowrap">
	{#if data.profileMatchesUserSession}
		<aside class="sidebar">
			<div class="mb-3 flex flex-row items-start justify-between">
				<h1 class="mb-2 text-xl font-bold">Pages</h1>
				<a
					title="Add Page"
					class="variant-ghost btn-icon btn-icon-sm"
					href={`/${$page.params.username}/new`}
				>
					<Icon icon="fluent:add-12-filled" font-size="1.5em" />
				</a>
			</div>

			<div class="flex flex-col gap-2">
				<a class="variant-ghost btn" href={`/${$page.params.username}`}>Profile</a>
				{#each data.pages as p}
					<a class="variant-ghost btn" href={`/${$page.params.username}/${p.slug}`}
						>{p.name || p.slug}</a
					>
				{/each}
			</div>

			<div class="flex-grow"></div>

			<h2 class="mb-2 text-lg font-bold">Settings</h2>
			<div class="flex flex-col gap-2">
				<button
					class="variant-outline btn"
					onclick={() => modalStore.trigger(manageSubscriptionModal)}
				>
					Manage Subscription
				</button>
				<button class="variant-outline btn" onclick={() => modalStore.trigger(setHandleModal)}>
					Change Handle
				</button>
				<button class="variant-outline btn" onclick={() => modalStore.trigger(deleteProfileModal)}>
					Delete Profile
				</button>
			</div>
		</aside>
	{/if}

	<div class="hidden flex-grow sm:block"></div>

	<div class="flex max-w-full grow flex-col items-center">
		{#if error}
			<aside class="alert variant-ghost-error relative mt-8 w-full">
				<div class="alert-message">
					<p>{error}</p>
				</div>
			</aside>
		{/if}

		{#if data.pendingDomainVerification}
			<aside class="alert variant-ghost-primary relative mt-8 w-full">
				<div class="alert-message">
					<p>
						<strong>Note:&nbsp;</strong>We are currently verifying your domain:
						<code>{data.pendingDomainVerification}</code>
					</p>
					<p>We will automatically update your handle once verification succeeds.</p>
					<div class="flex flex-row-reverse">
						<button
							type="button"
							class="variant-ghost-tertiary btn text-sm"
							onclick={cancelPendingDomainVerification}>Cancel Verification</button
						>
					</div>
				</div>
			</aside>
		{/if}
		{@render children()}
	</div>

	<div class="hidden flex-grow sm:block"></div>
</div>

<style>
	.sidebar {
		@apply sticky top-8 mx-4 my-8 flex w-full flex-shrink flex-col rounded-xl border-[1px] border-black bg-pink-300/10 p-5 sm:h-[85vh] sm:w-auto;
		.btn {
			text-wrap: wrap;
		}
	}
</style>
