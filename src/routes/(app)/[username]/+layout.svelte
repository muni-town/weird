<script lang="ts">
	import { type Snippet } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import SetHandleModal from './components/ChangeHandleModal.svelte';
	import ManageSubscriptionModal from './components/ManageSubscriptionModal.svelte';
	import DeleteProfileModal from './components/DeleteProfileModal.svelte';
	import ManageAccountModal from './components/ManageAccountModal.svelte';
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
	const manageAccountModal: ModalSettings = $derived({
		type: 'component',
		component: { ref: ManageAccountModal },
		userInfo: data.userInfo,
		providers: data.providers,
		atprotoDid: data.atprotoDid,
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

<div
	class="flex h-full max-w-full flex-row flex-wrap-reverse justify-center gap-2 p-2 sm:flex-nowrap"
>
	{#if data.profileMatchesUserSession}
		<aside
			class="sidebar card sticky top-2 flex w-full flex-shrink flex-col  sm:h-[91vh] sm:w-auto"
		>
			<div class="pt-4 pb-2 justify-stretch">
			<a
				class="w-full inline-flex items-center  p-1 gap-2 rounded-xl font-semibold hover:cursor-pointer hover:bg-slate-100 hover:bg-opacity-15"
				href={`/${$page.params.username}`}><Icon icon="fluent:person-24-filled" /> Profile</a
			>
			</div>
			<div class="flex flex-row items-start justify-between">
				<h2 class="font-semibold">Pages</h2>
				<a title="Add Page" class="btn-icon btn-icon-sm" href={`/${$page.params.username}/new`}>
					<Icon icon="fluent:add-12-filled" font-size="1.5em" />
				</a>
			</div>

			<ul class="scrollbar-thin flex max-h-full grow flex-col gap-1 overflow-auto justify-start">
				{#each data.pages as p}
					<li class="transition:color py-1 text-slate-300 hover:text-slate-100">
						<a href={`/${$page.params.username}/${p.slug}`}>{p.name || p.slug}</a>
					</li>
				{/each}
			</ul>
			<details class="h-fit flex-col py-4 ">
				<summary
					class="mb-2 flex items-center gap-2 rounded-lg p-1 font-semibold hover:cursor-pointer hover:bg-slate-100 hover:bg-opacity-15"
					><Icon icon="fluent:settings-24-filled" /> Settings
				</summary>
				<div class="flex h-fit flex-col gap-2">
					<button
						class="text-start text-slate-300"
						onclick={() => modalStore.trigger(manageSubscriptionModal)}
					>
						Manage Subscription
					</button>
					<button
						class="text-start text-slate-300"
						onclick={() => modalStore.trigger(manageAccountModal)}
					>
						Manage Account
					</button>
					<button
						class="text-start text-slate-300"
						onclick={() => modalStore.trigger(setHandleModal)}
					>
						Change Handle
					</button>
					<a class="text-start text-slate-300" href={`/${$page.params.username}/theme-editor`}>
						Theme Editor
					</a>
					<button
						class="text-start text-slate-300"
						onclick={() => modalStore.trigger(deleteProfileModal)}
					>
						Delete Profile
					</button>
				</div>
			</details>
		</aside>
	{/if}

	<div class="relative h-full w-full overflow-auto">
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
</div>

<style>
	.sidebar {
		flex-basis: 18em;
		& > * {
			padding-inline: 0.75rem;
		}
		.btn {
			text-wrap: wrap;
		}
	}
	.scrollbar-thin {
		scrollbar-width: thin;
	}
</style>
