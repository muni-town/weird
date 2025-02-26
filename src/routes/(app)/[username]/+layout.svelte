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
	import { goto, onNavigate } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';
	import Details from '$lib/components/layouts/Details.svelte';

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

	let drawerOpen = $state(false);
	onNavigate(() => {
		drawerOpen = false;
	});
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') drawerOpen = false;
	};
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
					class="sticky top-8 hidden w-full min-w-0 flex-shrink flex-col sm:flex sm:w-auto sm:min-w-64"
				>
					<div class="sidebar card flex w-full h-min flex-col pb-3 sm:max-h-[70vh]">
						<div class="justify-stretch pb-2 pt-4">
							<a
								class="inline-flex w-full items-center gap-2 rounded-xl p-2 px-3 font-semibold hover:cursor-pointer hover:bg-slate-100/15"
								href={`/${$page.params.username}`}
								><Icon icon="fluent:person-24-filled" /> Profile</a
							>
						</div>
						<div class="flex flex-row items-center justify-between">
							<h2 class="inline-flex items-center gap-2 px-3 py-1 font-semibold">
								<Icon icon="fluent:document-20-filled" />Pages
							</h2>
							<a
								title="Add Page"
								class="btn-icon btn-icon-sm hover:bg-slate-100/15"
								href={`/${$page.params.username}/new`}
							>
								<Icon icon="fluent:add-12-filled" font-size="1.5em" />
							</a>
						</div>

						<ul
							class="scrollbar-thin flex max-h-full grow flex-col justify-start gap-1 overflow-auto"
						>
							{#each data.pages as p}
								<li class="transition:color px-3 py-1 text-slate-300 hover:text-slate-100">
									<a href={`/${$page.params.username}/${p.slug}`}>{p.name || p.slug}</a>
								</li>
							{/each}
						</ul>
					</div>
					<div id="settings-panel" class="px-2 py-4">
						{@render settings()}
					</div>
				</aside>
				<div class="h-full w-full overflow-y-auto">
					{@render children()}
				</div>
			</div>
		{/if}
	</div>
	<div class="hidden flex-grow sm:block"></div>
</div>
{#if data.profileMatchesUserSession}
	<nav
		class="fixed bottom-0 z-20 mx-auto w-full rounded-t-xl border-[1px] border-black bg-pink-300/10 backdrop-blur-xl sm:hidden"
	>
		<div class="flex items-center justify-between px-4 py-4 font-semibold">
			<div class="px-3">
				{'slug' in $page.params ? 'Pages' : 'Profile'}
			</div>
			<button
				onkeydown={handleEscape}
				onclick={() => (drawerOpen = !drawerOpen)}
				aria-expanded={drawerOpen}
				aria-controls="drawer-content"
				aria-haspopup="menu"
				class="cursor-pointer"
			>
				<Icon icon="fluent:list-rtl-20-filled" font-size="1.5rem" />
			</button>
		</div>
	</nav>
	{#key drawerOpen}
		<div class="sm:hidden" hidden={!drawerOpen}>
			<div
				onclick={() => {
					drawerOpen = false;
				}}
				role="presentation"
				aria-hidden={true}
				onkeydown={handleEscape}
				class="fixed inset-0 z-10 bg-slate-950/20 backdrop-blur-[1px]"
				transition:fade={{ duration: 100 }}
			></div>
			<div
				id="drawer-content"
				class="fixed bottom-10 z-10 w-full rounded-t-xl border-[1px] border-black bg-pink-950/20 p-3 pb-6 backdrop-blur-xl "
				transition:slide={{ duration: 100 }}
			>
				<a
					class="flex items-center gap-2 rounded-lg p-1 px-3 py-2 font-semibold hover:cursor-pointer hover:bg-slate-100/15"
					href={`/${$page.params.username}`}><Icon icon="fluent:person-20-filled" />Profile</a
				>
				<Details name="drawer" sClass="flex flex-row items-center justify-between">
					{#snippet summary()}
						<div
							class="flex grow items-center gap-2 rounded-lg px-3 py-2 text-start font-semibold hover:cursor-pointer hover:bg-slate-100/15"
						>
							<Icon icon="fluent:document-20-filled" />
							Pages
						</div>
						<a
							title="Add Page"
							class="btn-icon btn-icon-sm hover:bg-slate-100/15"
							href={`/${$page.params.username}/new`}
						>
							<Icon icon="fluent:add-12-filled" font-size="1.5em" />
						</a>
					{/snippet}
					<ul
						class="scrollbar-thin flex max-h-[40vh] grow flex-col items-stretch gap-1 overflow-auto rounded-lg"
						transition:slide={{ duration: 100 }}
					>
						{#each data.pages as p}
							<li class="transition:color flex px-3 py-1 text-slate-300 hover:text-slate-100">
								<a href={`/${$page.params.username}/${p.slug}`} class="w-full">{p.name || p.slug}</a
								>
							</li>
						{/each}
					</ul>
				</Details>
				{@render settings()}
			</div>
		</div>
	{/key}
{/if}

{#snippet settings()}
	<Details
		name="drawer"
		sClass="flex items-center gap-2 rounded-lg p-2 px-3 font-semibold hover:cursor-pointer hover:bg-slate-100/15"
		cClass="flex flex-col gap-2"
	>
		{#snippet summary()}
			<Icon icon="fluent:settings-20-filled" /> Settings
		{/snippet}
		<button
			class="px-3 text-start text-slate-300 hover:text-slate-100"
			onclick={() => modalStore.trigger(manageSubscriptionModal)}
		>
			Manage Subscription
		</button>
		<button
			class="px-3 text-start text-slate-300 hover:text-slate-100"
			onclick={() => modalStore.trigger(manageAccountModal)}
		>
			Manage Account
		</button>
		<button
			class="px-3 text-start text-slate-300 hover:text-slate-100"
			onclick={() => modalStore.trigger(setHandleModal)}
		>
			Change Handle
		</button>
		<a
			class="px-3 text-start text-slate-300 hover:text-slate-100"
			href={`/${$page.params.username}/theme-editor`}
		>
			Theme Editor
		</a>
		<button
			class="px-3 text-start text-slate-200 hover:text-slate-100"
			onclick={() => modalStore.trigger(deleteProfileModal)}
		>
			Delete Profile
		</button>
	</Details>
{/snippet}

<style>
	.sidebar {
		flex-basis: 18em;
		border-bottom-right-radius: 0rem !important;
		border-top-right-radius: 0rem !important;
		border: none;
		box-shadow: -2px 0 0 -10px red;
		align-self: start;
		& > * {
			padding-inline: 0.75rem;
		}
	}
	.scrollbar-thin {
		scrollbar-width: thin;
	}
	#settings-panel {
		position: relative;
		--radius: 1rem;
		--bg-col: #f9a8d4;
		--bg-opacity: 10%;
		&::after {
			content: '';
			position: absolute;
			top: 0;
			right: 0;
			height: var(--radius);
			width: var(--radius);
			background: radial-gradient(circle at 0% 100%, transparent var(--radius), var(--bg-col) var(--radius));
			opacity: var(--bg-opacity);
		}
	}
	#conjoin {
		grid-template-columns: 1fr;
		@media (min-width: 800px) {
			grid-template-columns: min-content 1fr;
		}
	}
	:global(#conjoin main) {
		@media (min-width: 800px) {
			align-items: start;
		}
	}
	:global(#conjoin main > .card) {
		@media (min-width: 800px) {
			border-top-left-radius: 0rem !important;
			box-shadow: 1px 0 0 1px var(--tw-ring-color);
			border: none;
		}
	}
</style>
