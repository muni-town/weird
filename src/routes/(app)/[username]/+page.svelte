<script lang="ts">
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils';
	import type { PageData } from './$types';
	import { editingState } from './state.svelte';

	import {
		schema as markdownSchema,
		defaultMarkdownParser,
		defaultMarkdownSerializer
	} from 'prosemirror-markdown';
	import { buildInputRules, buildKeymap } from 'prosemirror-example-setup';
	import { EditorState } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { undo, redo, history } from 'prosemirror-history';
	import { keymap } from 'prosemirror-keymap';
	import { baseKeymap } from 'prosemirror-commands';
	import { Schema } from 'prosemirror-model';
	import CodeJar from '$lib/components/CodeJar.svelte';

	const textSchema = new Schema({
		nodes: {
			text: {},
			doc: { content: 'text*' }
		}
	});

	let { data }: { data: PageData } = $props();

	if (data.profileMatchesUserSession) {
		editingState.profile = data.profile;
	}

	let profile = $derived(data.profile as Profile);

	// We have to keep track of component-internal versions of our WYSIWYG editor contents so that
	// we can tell the difference between an update coming from outside the component and from
	// inside the component.
	let internalBio = $state(editingState.profile.bio || '');
	let internalDisplayName = $state(
		editingState.profile.display_name || editingState.profile.username || ''
	);

	let markdownMode = $state(false);

	// TODO: create separate components for markdown and plain text inline editing.

	// svelte-ignore non_reactive_update
	let bioEditorEl: HTMLDivElement;
	let bioEditor: EditorView | null = $state(null);
	$effect(() => {
		// If the state editing state was changed outside of this component, then update our
		// internal editor state.
		if (internalBio != (editingState.profile.bio || '')) {
			internalBio = editingState.profile.bio || '';
			if (bioEditor) {
				const len = bioEditor.state.doc.content.size;
				const newState = bioEditor.state.apply(
					bioEditor.state.tr
						.delete(0, len)
						.insert(0, defaultMarkdownParser.parse(editingState.profile.bio || ''))
				);
				bioEditor.updateState(newState);
			}
		}
	});
	function bioEditorPlugin(el: HTMLDivElement) {
		if (!editingState.profile.bio) editingState.profile.bio = 'About...';

		let s = EditorState.create({
			schema: markdownSchema,
			doc: defaultMarkdownParser.parse(editingState.profile.bio),
			plugins: [
				buildInputRules(markdownSchema),
				history(),
				keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo }),
				keymap(buildKeymap(markdownSchema)),
				keymap(baseKeymap)
			]
		});
		bioEditor = new EditorView(el, {
			state: s,
			dispatchTransaction(transaction) {
				const newState = bioEditor!.state.apply(transaction);
				internalBio = defaultMarkdownSerializer.serialize(newState.doc);
				editingState.profile.bio = internalBio;
				bioEditor!.updateState(newState);
			}
		});
	}

	// svelte-ignore non_reactive_update
	let displayNameEditorEl: HTMLDivElement;
	let displayNameEditor: EditorView | null = $state(null);
	$effect(() => {
		// If the state editing state was changed outside of this component, then update our
		// internal editor state.
		if (displayNameEditor && internalDisplayName != (editingState.profile.display_name || '')) {
			internalDisplayName =
				editingState.profile.display_name || editingState.profile.username?.split('@')[0] || '';
			const len = displayNameEditor.state.doc.content.size;
			const newState = displayNameEditor.state.apply(
				displayNameEditor.state.tr.delete(0, len).insert(0, textSchema.text(internalDisplayName))
			);
			displayNameEditor.updateState(newState);
		}
	});
	function displayNameEditorPlugin(el: HTMLDivElement) {
		let s = EditorState.create({
			schema: textSchema
		});
		s = s.apply(s.tr.insertText(internalDisplayName));
		displayNameEditor = new EditorView(el, {
			state: s,
			dispatchTransaction(transaction) {
				const newState = displayNameEditor!.state.apply(transaction);
				internalDisplayName = defaultMarkdownSerializer.serialize(newState.doc);
				editingState.profile.display_name = internalDisplayName;
				displayNameEditor!.updateState(newState);
			}
		});
	}
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
						onclick={() => (displayNameEditorEl.children[0] as HTMLElement).focus()}
						>Click to Edit!</button
					>
					<div bind:this={displayNameEditorEl} use:displayNameEditorPlugin></div>
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
							<button
								class="variant-filled badge"
								onclick={() => (bioEditorEl.children[0] as HTMLElement).focus()}
								>Click to Edit!</button
							>
						{/if}
					</div>
					{#if !markdownMode}
						<div bind:this={bioEditorEl} use:bioEditorPlugin></div>
					{:else}
						<CodeJar bind:content={editingState.profile.bio as string} />
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
