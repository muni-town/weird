<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import RichMarkdownEditor from './RichMarkdownEditor.svelte';
	import MarkdownEditor from './MarkdownEditor.svelte';
	import DagView from './DagView.svelte';
	import { LoroDoc } from 'loro-crdt';
	import { CursorAwareness } from 'loro-prosemirror';
	import { convertSyncStepsToNodes } from './editor-history';
	import './CollaborativeEditor.css';
	import type { ViewDagNode } from './DagView.svelte';
	import { toByteArray } from 'base64-js';

	let {
		content = $bindable(''),
		markdownMode = $bindable(false),
		maxLength,
		...attrs
	}: {
		content: string;
		maxLength?: number;
		markdownMode?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	let showHistory = $state(false);
	let dagInfo: { nodes: ViewDagNode[]; frontiers: string[] } = $state({
		nodes: [],
		frontiers: []
	});

	let loroDoc = new LoroDoc();
	let idA = loroDoc.peerIdStr;
	let awareness = new CursorAwareness(idA);
	const savedState = localStorage.getItem('loro-editor-state');
	if (savedState) {
		try {
			const blob = toByteArray(savedState);
			loroDoc.import(blob);
			console.log("imported saved state")
			console.log(loroDoc.toJSON())
			dagInfo = convertSyncStepsToNodes(loroDoc);
		} catch (e) {
			console.error('Failed to load saved state:', e);
		}
	}


	// 初始化时开启时间戳记录
	loroDoc.setRecordTimestamp(true);
	loroDoc.setChangeMergeInterval(10);

	// 监听变化更新历史信息
	loroDoc.subscribe((event) => {
		if (event.by === "local") {
			dagInfo = convertSyncStepsToNodes(loroDoc);
		}
	});

	function toggleHistory() {
		showHistory = !showHistory;
	}

	let shouldWiggle = $state(false);

	const contentProxy = {
		get value() {
			return content;
		},
		set value(value) {
			if (maxLength != undefined) {
				if (value && value.length > maxLength) {
					shouldWiggle = true;
					content = value.slice(0, maxLength);
				} else {
					content = value;
				}
			} else {
				content = value;
			}
		}
	};
</script>

<div class="container">
	<div class="editors-container">
		<div class="editor-card">
			<div class="editor-header">
				<h3 class="editor-title">Editor</h3>
				<div class="flex gap-2">
					{#if maxLength != undefined}
						<div
							class="variant-filled badge transition-transform"
							class:too-long-content-badge={shouldWiggle}
							onanimationend={() => (shouldWiggle = false)}
						>
							Length: {content.length} / {maxLength}
						</div>
					{/if}
					<button class="variant-filled badge" onclick={() => (markdownMode = !markdownMode)}>
						{markdownMode ? 'Switch to Rich Text' : 'Switch to Markdown'}
					</button>
					<button class="status-button" onclick={toggleHistory}>
						{showHistory ? 'Hide History' : 'Show History'}
					</button>
				</div>
			</div>
			<div class="editor-content">
				{#if !markdownMode}
					<RichMarkdownEditor
						loro={loroDoc}
						awareness={awareness}
						containerId={loroDoc.getMap("doc").id}
						bind:content={contentProxy.value}
					/>
				{:else}
					<MarkdownEditor bind:content={contentProxy.value} />
				{/if}
			</div>
		</div>
	</div>

	{#if showHistory}
		<div class="history-card">
			<h3 class="history-title">Operation History</h3>
			<DagView nodes={dagInfo.nodes} frontiers={dagInfo.frontiers} />
		</div>
	{/if}
</div>

<style>
	@keyframes wiggle {
		0% {
			transform: rotate(0deg);
		}
		20% {
			transform: rotate(-10deg);
		}
		40% {
			transform: rotate(10deg);
		}
		60% {
			transform: rotate(-10deg);
		}
		80% {
			transform: rotate(10deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	.too-long-content-badge {
		@apply variant-filled-error;
		animation: wiggle;
		animation-duration: 1s;
	}

	.flex {
		display: flex;
	}

	.gap-2 {
		gap: 0.5rem;
	}
</style>
