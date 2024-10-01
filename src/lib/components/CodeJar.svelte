<script lang="ts">
	// TODO: use codemirror to align better with our use of prosemirror for WYSIWYG.
	import type { CodeJar } from 'codejar';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { content = $bindable(), ...attrs }: { content: string } & HTMLAttributes<HTMLDivElement> =
		$props();

	let editorElement: HTMLElement = $state(undefined) as any;
	let editor: CodeJar | undefined = $state(undefined);

	let internalContent = $state('');
	$effect(() => {
		if (internalContent != content && editor) {
			editor.updateCode(content);
		}
	});

	onMount(async () => {
		const { CodeJar } = await import('codejar');
		editor = CodeJar(editorElement, () => {}, {
			tab: '  ',
			addClosing: false,
			indentOn: /[]/
		});
		editor.updateCode(content);
		editor.onUpdate((c) => {
			content = c;
		});
	});
</script>

<div
	bind:this={editorElement}
	{...attrs}
	class="text-md w-full p-4 font-mono text-sm border-token rounded-container-token"
></div>
