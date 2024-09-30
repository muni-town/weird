<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { getModalStore, getToastStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { checkResponse } from '$lib/utils';
	import { editingState } from './state.svelte';

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
</script>

<div class="flex flex-row flex-wrap-reverse sm:flex-nowrap">
	<aside
		class="card sticky top-8 mx-4 my-8 w-full min-w-[13em] p-5 sm:h-[85vh] sm:w-auto"
		class:hidden={!data.profileMatchesUserSession}
	>
		<div class="flex items-center gap-4">
			<h1 class="mb-2 text-xl font-bold">My Profile {editingState.editing ? '( Editing )' : ''}</h1>

			{#if !editingState.editing}
				<button class="variant-ghost btn" onclick={() => (editingState.editing = true)}>
					Edit
				</button>
			{/if}
		</div>
		{#if editingState.editing}
			<form
				method="post"
				action="?/update"
				class="flex flex-col gap-4"
				enctype="multipart/form-data"
			>
				<input type="hidden" name="username" bind:value={editingState.profile.username} />
				<input type="hidden" name="display_name" bind:value={editingState.profile.display_name} />
				<label>
					<div>Update Avatar</div>
					<input name="avatar" type="file" class="input" accept=".jpg, .jpeg, .png, .webp, .gif" />
				</label>
				<input type="hidden" name="bio" bind:value={editingState.profile.bio} />
				<input type="hidden" name="tags" bind:value={editingState.profile.tags} />

				<button class="variant-ghost btn"> Save </button>
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
