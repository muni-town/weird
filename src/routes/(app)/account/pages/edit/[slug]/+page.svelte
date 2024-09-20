<script lang="ts">
	import type { CodeJar } from 'codejar';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import sanitizeHtml from 'sanitize-html';
	import { browser } from '$app/environment';
	import { marked } from 'marked';

	const { data }: { data: PageData } = $props();

	let editorElement: HTMLElement = $state(undefined) as any;
	let editor: CodeJar | undefined = $state(undefined);
	let markdown = $state(data.markdown || '');
	let html = $state('');

	$effect(() => {
		if (browser) {
			html = sanitizeHtml(marked.parse(markdown) as string);
		}
	});

	onMount(async () => {
		const { CodeJar } = await import('codejar');
		editor = CodeJar(editorElement, () => {}, {
			tab: '  ',
			addClosing: false,
			indentOn: /[]/
		});
		editor.updateCode(markdown);
		editor.onUpdate((c) => {
			markdown = c;
		});
	});
</script>

<h1 class="text-2xl">Edit Page: <code>{data.slug}</code></h1>

<form class="flex w-full flex-col" method="post">
	<label class="mb-5">
		<div class="mb-1">Page Name</div>
		<input class="input" name="pageName" value={data.pageName} />
	</label>
	<div class="mb-4 flex w-full justify-between gap-2">
		<div class="w-full">
			<div
				bind:this={editorElement}
				class="text-md w-full p-4 font-mono text-lg border-token rounded-container-token"
			></div>
		</div>

		<div class="prose w-full p-5 border-token rounded-container-token dark:prose-invert">
			{@html html}
		</div>
	</div>

	{#if data.links}
		<div class="my-8 flex flex-col items-center">
			<h3 class="mt-4 text-center text-2xl font-bold">Links</h3>
			<p class="mb-4"><strong>Note:</strong> links cannot be edited yet.</p>
			{#if data.links.length > 0}
				{#each data.links as link}
					<a class="variant-ghost btn" target="_blank" href={link.url}>
						{link.label || link.url}
					</a>
				{/each}
			{:else}
				No links
			{/if}
		</div>
	{/if}

	<div class="flex flex-row-reverse justify-between">
		<input type="hidden" name="slug" bind:value={data.slug} />
		<input type="hidden" name="markdown" bind:value={markdown} />
		<input type="hidden" name="links" value={data.links ? JSON.stringify(data.links) : undefined} />
		<button type="submit" class="variant-ghost btn">Save</button>
		<input type="submit" name="delete" class="variant-ghost-error btn" value="Delete" />
	</div>
</form>
