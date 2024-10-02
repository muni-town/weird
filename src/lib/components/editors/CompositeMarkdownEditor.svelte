<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import RichMarkdownEditor from './RichMarkdownEditor.svelte';
	import MarkdownEditor from './MarkdownEditor.svelte';
	import type { SvelteComponent } from 'svelte';

	let {
		content = $bindable(),
		markdownMode = $bindable(false),
		...attrs
	}: { content: string; markdownMode?: boolean } & HTMLAttributes<HTMLDivElement> = $props();

	// svelte-ignore non_reactive_update
	let richEditorEl: SvelteComponent;
</script>

<div {...attrs}>
	<div class="absolute right-0 top-0 z-10">
		<button class="variant-filled badge" onclick={() => (markdownMode = !markdownMode)}
			>{markdownMode ? 'Switch to Rich Text' : 'Switch to Markdown'}</button
		>
		{#if !markdownMode}
			<button class="variant-filled badge" onclick={() => richEditorEl.focus()}
				>Click to Edit!</button
			>
		{/if}
	</div>
	{#if !markdownMode}
		<RichMarkdownEditor bind:this={richEditorEl} bind:content />
	{:else}
		<MarkdownEditor bind:content />
	{/if}
</div>
