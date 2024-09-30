<script lang="ts">
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils';
	import type { PageData } from './$types';
	import { editingState } from './state.svelte';
	import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
	import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
	import { gfm } from '@milkdown/kit/preset/gfm';
	import { commonmark } from '@milkdown/kit/preset/commonmark';

	import { nord } from '@milkdown/theme-nord';
	import '@milkdown/theme-nord/style.css';

	let { data }: { data: PageData } = $props();

	if (data.profileMatchesUserSession) {
		editingState.profile = data.profile;
	}

	let profile = $derived(data.profile as Profile);

	function editor(dom: unknown) {
		// to obtain the editor instance we need to store a reference of the editor.
		const MakeEditor = Editor.make()
			.config((ctx) => {
				ctx.set(rootCtx as any, dom);
				ctx.set(defaultValueCtx as any, editingState.profile.bio);
			})
			.config((ctx) => {
				nord(ctx);
				ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
					editingState.profile.bio = markdown;
				});
			})
			.use(listener)
			.use(commonmark)
			.use(gfm)
			.create();
	}
</script>

<svelte:head>
	<title>
		{profile.display_name || profile.username} |
		{env.PUBLIC_INSTANCE_NAME}
	</title>
</svelte:head>

<main class="flex flex-col items-center">
	<div class="card m-4 mt-12 flex max-w-[600px] flex-col gap-4 p-8 text-xl">
		<div class="flex items-center gap-4">
			<Avatar username={profile.username} />
			<h1 class="my-3 text-4xl">{profile.display_name || profile.username}</h1>
		</div>

		<hr class="mb-4" />

		<div class="flex flex-col gap-4">
			{#if profile.bio}
				<div class="prose mx-auto max-w-2xl overflow-x-auto px-4 py-12 dark:prose-invert">
					{#if !editingState.editing}
						{@html renderMarkdownSanitized(profile.bio)}
					{:else}
						<div use:editor></div>
					{/if}
				</div>
			{/if}
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
	:global(.milkdown div) {
		padding: 1em;
		border: none !important;
	}
</style>
