<script lang="ts">
	import type { CodeJar } from 'codejar';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import DOMPurify from 'dompurify';
	import { browser } from '$app/environment';
	import { marked } from 'marked';

	const { data }: { data: PageData } = $props();

	let editorElement: HTMLElement = $state(undefined) as any;
	let editor: CodeJar | undefined = $state(undefined);
	let markdown = $state(data.markdown || '');
	let html = $state('');

	$effect(() => {
		if (browser) {
			html = DOMPurify.sanitize(marked.parse(markdown) as string);
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

	<div class="flex justify-between">
		<input type="hidden" name="slug" bind:value={data.slug} />
		<input type="hidden" name="markdown" bind:value={markdown} />
		<input type="submit" name="delete" class="variant-ghost-error btn" value="Delete" />
		<button class="variant-ghost btn">Save</button>
	</div>
</form>
