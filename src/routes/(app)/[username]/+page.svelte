<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import InlineTextEditor from '$lib/components/editors/InlineTextEditor.svelte';
	import MarkdownEditor from '$lib/components/editors/MarkdownEditor.svelte';
	import RichMarkdownEditor from '$lib/components/editors/RichMarkdownEditor.svelte';

	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils';
	import type { PageData } from './$types';
	import { editingState } from './state.svelte';

	let { data }: { data: PageData } = $props();

	// Prepare editing state, if this is the logged in user's profile page.
	if (data.profileMatchesUserSession) {
		editingState.profile = data.profile;
	}

	let profile = $derived(data.profile as Profile);
	let markdownMode = $state(false);

	// svelte-ignore non_reactive_update
	let displayNameEditorEl: SvelteComponent;
	// svelte-ignore non_reactive_update
	let bioEditorEl: SvelteComponent;
</script>

<svelte:head>
	<title>
		{profile.display_name || profile.username} |
		{env.PUBLIC_INSTANCE_NAME}
	</title>
</svelte:head>

<main class="mx-4 flex w-full flex-col items-center">
	<div class="card m-4 mt-12 flex w-full max-w-[700px] flex-col gap-4 p-8 text-xl">
		<div class="flex items-center gap-4">
			<Avatar username={profile.username} />
			<h1 class="relative my-3 text-4xl">
				{#if !editingState.editing}
					{profile.display_name || profile.username}
				{:else}
					<button
						class="variant-filled badge absolute right-[-4em] top-[-1em]"
						onclick={() => displayNameEditorEl.focus()}>Click to Edit!</button
					>
					<InlineTextEditor
						bind:this={displayNameEditorEl}
						bind:content={editingState.profile.display_name as string}
					/>
				{/if}
			</h1>
		</div>

		<hr class="mb-4" />

		<div class="flex flex-col gap-4">
			<div class="prose relative mx-auto w-full max-w-2xl px-4 py-5 dark:prose-invert">
				{#if !editingState.editing}
					{@html renderMarkdownSanitized(profile.bio || '')}
				{:else}
					<div class="absolute right-0 top-0">
						<button class="variant-filled badge" onclick={() => (markdownMode = !markdownMode)}
							>{markdownMode ? 'Switch to Rich Text' : 'Switch to Markdown'}</button
						>
						{#if !markdownMode}
							<button class="variant-filled badge" onclick={() => bioEditorEl.focus()}
								>Click to Edit!</button
							>
						{/if}
					</div>
					{#if !markdownMode}
						<RichMarkdownEditor
							bind:this={bioEditorEl}
							bind:content={editingState.profile.bio as string}
						/>
					{:else}
						<MarkdownEditor bind:content={editingState.profile.bio as string} />
					{/if}
				{/if}
			</div>
			{#if profile.links}
				{#each profile.links as link}
					<a class="variant-ghost btn" href={link.url}>
						{link.label || link.url}
					</a>
				{/each}
			{/if}
			{#if profile.tags && profile.tags.length > 0}
				<div class="flex items-center gap-2">
					<strong>Tags: </strong>
					<span class="flex flex-wrap gap-2 text-base">
						{#each profile.tags as tag}
							<a
								class="text-surface-900-50-token btn rounded-md bg-surface-200 p-1 hover:bg-surface-400 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-700"
								href={`/people?q=${tag}`}
							>
								{tag}
							</a>
						{/each}
					</span>
				</div>
			{/if}
			{#if data.pages.length > 0}
				<h3 class="mt-4 text-center text-2xl font-bold">Pages</h3>
				{#each data.pages as page}
					<a class="variant-ghost btn" href={`/${data.username}/${page.slug}`}>
						{page.name || page.slug}
					</a>
				{/each}
			{/if}
		</div>
	</div>
</main>

<style>
	:global(div[contenteditable='true']) {
		padding: 0.5em;
	}
</style>
