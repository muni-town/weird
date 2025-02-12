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

<div class="flex h-full max-w-full flex-row flex-wrap-reverse justify-center p-2 sm:flex-nowrap">
	<div class="hidden flex-grow sm:block"></div>

	<div class="flex max-w-full grow flex-col items-center">
		{#if error}
			<aside class="alert variant-ghost-error relative mt-8 w-full">
				<div class="alert-message">
					<p>{error}</p>
				</div>
			</aside>
		{/if}

		{#if false || data.pendingDomainVerification}
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

		{#if !data.profileMatchesUserSession}
			{@render children()}
		{:else}
			<div id="conjoin" class="relative mt-6 grid h-full w-full items-start">
				<aside
					class=" sticky top-8 hidden w-full min-w-0 flex-shrink flex-col sm:flex sm:w-auto sm:min-w-64"
				>
					<div class="sidebar card flex flex-col sm:max-h-[70vh]">
						<div class="justify-stretch pb-2 pt-4">
							<a
								class="inline-flex w-full items-center gap-2 rounded-xl p-1 font-semibold hover:cursor-pointer hover:bg-slate-100 hover:bg-opacity-15"
								href={`/${$page.params.username}`}
								><Icon icon="fluent:person-24-filled" /> Profile</a
							>
						</div>
						<div class="flex flex-row items-start justify-between">
							<h2 class="font-semibold">Pages</h2>
							<a
								title="Add Page"
								class="btn-icon btn-icon-sm"
								href={`/${$page.params.username}/new`}
							>
								<Icon icon="fluent:add-12-filled" font-size="1.5em" />
							</a>
						</div>

						<ul
							class="scrollbar-thin flex max-h-full grow flex-col justify-start gap-1 overflow-auto"
						>
							{#each data.pages as p}
								<li class="transition:color py-1 text-slate-300 hover:text-slate-100">
									<a href={`/${$page.params.username}/${p.slug}`}>{p.name || p.slug}</a>
								</li>
							{/each}
						</ul>
					</div>
					<details class="h-fit flex-col py-4">
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
				<div class="h-full w-full overflow-y-auto">
					{@render children()}
				</div>
			</div>
		{/if}
	</div>
	<div class="hidden flex-grow sm:block"></div>
</div>

<style>
	.sidebar {
		flex-basis: 18em;
		border-bottom-right-radius: 0rem !important;
		border-top-right-radius: 0rem !important;
		border-right: none;
		border: none;
		box-shadow: -2px 0 0 -10px red;
		height: min-content;
		align-self: start;
		/* var(--tw-ring-color); */
		& > * {
			padding-inline: 0.75rem;
		}
	}
	.scrollbar-thin {
		scrollbar-width: thin;
	}
	details {
		border-top-right-radius: 1rem;
		border-right: 1px solid black;
		/* border-top: 1px solid black; */
		/* @apply rounded-xl border-[1px] border-black bg-pink-300/10; */
		border: none;
	}
	#conjoin {
		grid-template-columns: 1fr;
		@media (min-width: 800px) {
			grid-template-columns: min-content minmax(300px, max-content);
		}
	}
	:global(#conjoin main > .card) {
		/* border-bottom-left-radius: 0rem !important; */
		@media (min-width: 800px) {
			border-top-left-radius: 0rem !important;
			border-left: none;
			box-shadow: 1px 0 0 1px var(--tw-ring-color);
			border: none;
		}
	}
</style>
