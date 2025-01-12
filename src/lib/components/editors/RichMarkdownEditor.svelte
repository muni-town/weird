<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
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
	import { LoroDoc } from 'loro-crdt';
	import {
		CursorAwareness,
		LoroCursorPlugin,
		LoroSyncPlugin,
		LoroUndoPlugin
	} from 'loro-prosemirror';
	import { fromByteArray, toByteArray } from 'base64-js';

	import 'prosemirror-view/style/prosemirror.css';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		content: string;
		loro: LoroDoc;
		awareness: CursorAwareness;
		containerId: string;
	}

	let { content = $bindable(''), loro: loroDoc, awareness: cursorAwareness, containerId, ...attrs }: Props = $props();
	let initialized = false;
	let editor: EditorView = $state() as any;
	let saveTimeout: number | undefined = $state();
	let unsubscribe: (() => void) | undefined = $state();

	// 初始化或从localStorage加载LoroDoc
	function initLoroDoc() {
		initialized= true;
		console.log("initLoroDoc")
		const savedState = localStorage.getItem('loro-editor-state');
		const sessionId = Math.floor(Math.random() * 1000000).toString(16);
		loroDoc.setNextCommitMessage(`sessionId: ${sessionId}`);
		
		if (savedState) {
			try {
				const blob = toByteArray(savedState);
				loroDoc.import(blob);
			} catch (e) {
				console.error('Failed to load saved state:', e);
			}
		}

		cursorAwareness = new CursorAwareness(loroDoc.peerIdStr);
		
		// 监听文档变化并保存
		unsubscribe = loroDoc.subscribe(() => {
			console.log("currentDoc",loroDoc.toJSON())
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}
			saveTimeout = setTimeout(() => {
				const state = loroDoc.export({ mode: 'snapshot' });
				localStorage.setItem('loro-editor-state', fromByteArray(state));
				saveTimeout = undefined;
			}, 1000) as unknown as number;
			loroDoc.setNextCommitMessage(`sessionId: ${sessionId}`);
		});

		// 初始化文档内容
		const text = loroDoc.getText('content');
		if (text.length === 0 && content) {
			text.insert(0, content);
		}
	}

	let internalContent = $state('');
	$effect(() => {
		if (internalContent != content && editor) {
			internalContent = content;
			const len = editor.state.doc.content.size;
			const newState = editor.state.apply(
				editor.state.tr.delete(0, len).insert(0, defaultMarkdownParser.parse(internalContent))
			);
			editor.updateState(newState);
		}
	});

	function editorPlugin(el: HTMLElement) {
		if (!initialized) {
			initLoroDoc();
		}

		let s = EditorState.create({
			schema: markdownSchema,
			doc: defaultMarkdownParser.parse(content),
			plugins: [
				buildInputRules(markdownSchema),
				history(),
				keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-y': redo }),
				keymap(buildKeymap(markdownSchema)),
				keymap(baseKeymap),
				LoroSyncPlugin({ doc: loroDoc as any }),
				LoroUndoPlugin({ doc: loroDoc as any }),
				LoroCursorPlugin(cursorAwareness, {})
			]
		});

		editor = new EditorView(el, {
			state: s,
			dispatchTransaction(transaction) {
				const newState = editor.state.apply(transaction);
				internalContent = defaultMarkdownSerializer.serialize(newState.doc);
				content = internalContent;
				editor.updateState(newState);
			}
		});
	}

	export function focus() {
		editor.focus();
	}

	// 组件卸载时保存状态和清理订阅
	$effect.root(() => {
		return () => {
			if (loroDoc) {
				if (saveTimeout) {
					clearTimeout(saveTimeout);
				}
				if (unsubscribe) {
					unsubscribe();
				}
				const state = loroDoc.export({ mode: 'snapshot' });
				localStorage.setItem('loro-editor-state', fromByteArray(state));
			}
		};
	});
</script>

<div use:editorPlugin {...attrs}></div>

<style>
	div :global(div[contenteditable='true']) {
		padding: 0.5em;
	}
	div :global(div[contenteditable='true']:focus) {
		outline: 1px solid white;
		outline-offset: 0.25em;
		border-radius: 0.75em;
	}
</style>
