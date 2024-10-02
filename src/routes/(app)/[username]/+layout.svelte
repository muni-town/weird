<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { getModalStore, getToastStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { checkResponse } from '$lib/utils';
	import { editingState } from './state.svelte';
	import { env } from '$env/dynamic/public';

	let { children }: { children: Snippet } = $props();
	let data = $derived($page.data);

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const modal: ModalSettings = {
		type: 'prompt',
		// Data
		title: 'Enter Github Username',
		body: 'Provide your github username to fetch README.md',
		// Populates the input value and attributes
		value: '',
		valueAttr: { type: 'text', required: true },
		// Returns the updated response value
		response: async (r: string) => {
			if (r && r.trim().length) {
				const repoResp = await fetch(`https://raw.githubusercontent.com/${r}/${r}/HEAD/README.md`);
				try {
					await checkResponse(repoResp);
					editingState.profile.bio = await repoResp.text();
				} catch (e) {
					toastStore.trigger({
						message: 'Github profile not exists',
						hideDismiss: true,
						timeout: 3000,
						background: 'variant-filled-error'
					});
					console.error('Error fetching GitHub README', e);
				}
			}
		}
	};

	let editingUsernameProxy = $state({
		get value() {
			return editingState.profile.username?.split('@')[0];
		},
		set value(value) {
			editingState.profile.username = `${value}@${env.PUBLIC_DOMAIN}`;
		}
	});
	let editingLinksProxy = $state({
		get value() {
			return JSON.stringify(editingState.profile.links);
		}
	});
</script>

<div class="flex flex-row flex-wrap-reverse sm:flex-nowrap">
	<aside
		class="card sticky top-8 mx-4 my-8 w-full min-w-[15em] p-5 sm:h-[85vh] sm:w-auto"
		class:hidden={!data.profileMatchesUserSession}
	>
		{#if $page.form?.error}
			<aside class="alert variant-ghost-error my-2 w-full">
				<div class="alert-message">
					<p>Error updating profile: {$page.form.error}</p>
				</div>
			</aside>
		{/if}
		<div class="flex items-center gap-4">
			<h1 class="mb-2 text-xl font-bold">My Profile {editingState.editing ? '( Editing )' : ''}</h1>

			<div class="flex-grow"></div>

			{#if !editingState.editing}
				<button class="variant-ghost btn" onclick={() => (editingState.editing = true)}>
					Edit
				</button>
			{/if}
		</div>
		{#if editingState.editing}
			<form method="post" class="flex flex-col gap-4" enctype="multipart/form-data">
				<label>
					Username
					<input name="username" class="input" bind:value={editingUsernameProxy.value} />
				</label>
				<input type="hidden" name="display_name" value={editingState.profile.display_name} />
				<!-- TODO: Incorporate Justin's avatar editor component instead of using this. -->
				<label>
					<div>Update Avatar</div>
					<input name="avatar" type="file" class="input" accept=".jpg, .jpeg, .png, .webp, .gif" />
				</label>
				<input type="hidden" name="bio" value={editingState.profile.bio} />
				<input type="hidden" name="tags" value={editingState.profile.tags} />
				<input type="hidden" name="links" value={editingLinksProxy.value} />

				<div class="flex flex-row-reverse gap-2">
					<button class="variant-ghost-success btn basis-full"> Save </button>
					<button
						class="variant-ghost btn basis-full"
						onclick={(e) => {
							e.preventDefault();
							editingState.editing = false;
							editingState.profile = data.profile;
						}}
					>
						Cancel</button
					>
				</div>
			</form>

			<h2 class="my-2 text-lg font-bold">Importer</h2>

			<button class="variant-ghost btn" onclick={() => modalStore.trigger(modal)}>
				Import GitHub Profile
			</button>
		{/if}
	</aside>

	<div class="hidden flex-grow sm:block"></div>

	{@render children()}

	<div class="hidden flex-grow sm:block"></div>
</div>
