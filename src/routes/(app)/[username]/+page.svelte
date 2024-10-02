<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import InlineTextEditor from '$lib/components/editors/InlineTextEditor.svelte';

	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';
	import type { PageData } from './$types';
	import { editingState } from './state.svelte';
	import CompositeMarkdownEditor from '$lib/components/editors/CompositeMarkdownEditor.svelte';
	import LinksEditor from '$lib/components/editors/LinksEditor.svelte';

	let { data }: { data: PageData } = $props();

	// Prepare editing state, if this is the logged in user's profile page.
	if (data.profileMatchesUserSession) {
		editingState.profile = data.profile;
	}

	// Here we have to hack a unique ID in for each of the links so that it can be used by the
	// LinksEditor component.
	//
	// It'd be good to find a better way to do this.
	$effect(() => {
		for (const link of editingState.profile.links) {
			if (!(link as any).id) (link as any).id = Math.random().toString();
		}
	});

	let profile = $derived(data.profile as Profile);
	let pubpageHost = $derived(
		data.profile.custom_domain ||
			`${data.profile.username?.split('@')[0]}.${env.PUBLIC_USER_DOMAIN_PARENT}`
	);
	let pubpageUrl = $derived(`${new URL(env.PUBLIC_URL).protocol}//${pubpageHost}`);

	let editingTagsState = $state(data.profile.tags.join(', '));
	let editingTagsProxy = $state({
		get value() {
			return editingTagsState;
		},
		set value(value: string) {
			editingTagsState = value;
			editingState.profile.tags = value
				.split(',')
				.map((x) => x.trim())
				.filter((x) => !!x);
		}
	});

	// svelte-ignore non_reactive_update
	let displayNameEditorEl: SvelteComponent;
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
			<div>
				<h1 class="relative my-3 text-4xl">
					{#if !editingState.editing}
						{profile.display_name || profile.username}
					{:else}
						<button
							class="variant-filled badge absolute right-[-4em] top-[-1em] z-10"
							onclick={() => displayNameEditorEl.focus()}>Click to Edit!</button
						>
						<InlineTextEditor
							bind:this={displayNameEditorEl}
							bind:content={editingState.profile.display_name as string}
						/>
					{/if}
				</h1>
				<a
					class="text-center text-sm text-surface-100 underline decoration-1 underline-offset-4"
					href={pubpageUrl}>{pubpageHost}</a
				>
			</div>
		</div>

		<hr class="mb-4" />

		<div class="flex flex-col gap-2">
			<div class="prose relative mx-auto w-full max-w-2xl px-4 pt-4 dark:prose-invert">
				{#if !editingState.editing}
					{@html renderMarkdownSanitized(profile.bio || '')}
				{:else}
					<CompositeMarkdownEditor bind:content={editingState.profile.bio as string} />
				{/if}
			</div>
			{#if profile.links.length > 0 || editingState.editing}
				<div>
					<h2 class="mb-4 text-center text-2xl font-bold">Links</h2>

					{#if !editingState.editing}
						<ul class="flex flex-col items-center gap-2">
							{#each profile.links as link}
								<li>
									<a class="variant-ghost btn" href={link.url}>
										{link.label || link.url}
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<LinksEditor bind:links={editingState.profile.links as any} />
					{/if}
				</div>
			{/if}
			{#if profile.tags.length > 0 || editingState.editing}
				<div class="mt-4 flex flex-wrap items-baseline gap-2">
					<strong>Tags: </strong>
					{#if editingState.editing}
						<span class="text-sm"> Separate multiple tags with commas.</span>
						<div class="basis-full">
							<input class="input" bind:value={editingTagsProxy.value} />
						</div>
					{/if}
					<span class="flex flex-wrap gap-2 text-base">
						{#each editingState.editing ? editingState.profile.tags : profile.tags as tag}
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
