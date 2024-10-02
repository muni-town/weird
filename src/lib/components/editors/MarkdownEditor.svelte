<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { minimalSetup, EditorView } from 'codemirror';
	import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
	import { markdown } from '@codemirror/lang-markdown';
	import { tags as t } from '@lezer/highlight';

	let { content = $bindable(), ...attrs }: { content: string } & HTMLAttributes<HTMLDivElement> =
		$props();

	let editor: EditorView = $state() as any;

	let internalContent = $state('');
	$effect(() => {
		if (internalContent != content && editor) {
			editor.update([
				editor.state.update({
					changes: [{ from: 0, to: editor.state.doc.length, insert: content }]
				})
			]);
		}
	});

	function editorPlugin(element: HTMLElement) {
		editor = new EditorView({
			doc: content,
			extensions: [
				minimalSetup,
				markdown(),
				EditorView.lineWrapping,
				EditorView.theme({
					'&.cm-focused .cm-cursor': {
						borderLeftColor: 'white'
					}
				}),
				syntaxHighlighting(
					HighlightStyle.define([
						{ tag: t.content, color: 'var(--theme-font-color-base)' },
						{ tag: t.processingInstruction, color: 'white', fontWeight: 'bold' },
						{ tag: t.strong, fontWeight: 'bold', color: 'white' },
						{ tag: t.emphasis, fontStyle: 'italic' },
						{ tag: t.link, textDecoration: 'underline' },
						{ tag: t.url, color: '#BBA2F1' },
						{ tag: t.heading, fontWeight: 'bold', textDecoration: 'underline', color: 'white' }
					])
				)
			],
			dispatch(tr, view) {
				view.update([tr]);
				internalContent = view.state.doc.toString();
				content = internalContent;
			},
			parent: element
		});
	}
</script>

<div use:editorPlugin {...attrs} class="code-editor"></div>

<style>
	div:global(.code-editor) {
		font-size: 0.8em;
		padding: 0.75em;
		border: 2px solid white;
		border-radius: 1em;
	}
	div:global(.code-editor .cm-scroller) {
		scrollbar-width: thin;
	}
	div:global(.code-editor .cm-editor) {
		border-radius: 1em;
		overflow: hidden;
	}
	div:global(.code-editor .cm-editor.cm-focused) {
		outline: none;
	}
</style>
