<script lang="ts">
	import { page } from '$app/stores';
	import { checkResponse } from '$lib/utils/http';
	import { onMount } from 'svelte';
	import { ProgressRadial, RangeSlider } from '@skeletonlabs/skeleton';
	import { LoroDoc } from 'loro-crdt';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';

	let showVersion = $state(0);
	let snapshot = $state(undefined) as Uint8Array | undefined;
	let markdown = $state('');
	let loroDoc = $derived.by(() => {
		if (snapshot) {
			const doc = new LoroDoc();
			doc.import(snapshot);
			return doc;
		}
	});
	let changes = $derived.by(() => {
		if (loroDoc) {
			return loroDoc.getAllChanges();
		}
		return new Map() as ReturnType<LoroDoc['getAllChanges']>;
	});
	let changeTimestamps = $derived.by(() => {
		const timestamps = [...changes.values()].flat().map((x) => x.timestamp);
		timestamps.sort((a, b) => a - b);
		return timestamps;
	});

	const getFrontierForTimestamp = (ts: number): { peer: string; counter: number }[] => {
		const frontiers = [] as { peer: string; counter: number }[];
		changes.forEach((changes, peer) => {
			let counter = 0;
			for (const change of changes) {
				if (change.timestamp <= ts) {
					counter = Math.max(counter, change.counter + change.length - 1);
				}
			}
			if (counter > 0) {
				frontiers.push({ counter, peer });
			}
		});
		return frontiers;
	};

	$effect(() => {
		if (loroDoc) {
			showVersion = changeTimestamps.length;
		}
	});

	$effect(() => {
		if (loroDoc) {
			const ts = changeTimestamps[showVersion - 1];
			const frontiers = getFrontierForTimestamp(ts);
			loroDoc.checkout(frontiers as any);
			markdown = loroDoc.getText('content').toString();
		}
	});

	onMount(async () => {
		const resp = await fetch(`/${$page.params.username}/${$page.params.slug}/loroSnapshot`);
		await checkResponse(resp);
		snapshot = new Uint8Array(await resp.arrayBuffer());
	});
</script>

<main class="mx-4 flex w-full flex-col items-center px-2 font-spacemono">
	<div
		class="card relative m-4 mt-12 flex w-full max-w-[1000px] flex-col justify-center gap-4 rounded-xl p-8 text-xl"
	>
		<h1 class="text-center text-2xl font-bold">
			Revisions for <a
				class="underline underline-offset-4"
				href={`/${$page.params.username}/${$page.params.slug}`}><code>{$page.params.slug}</code></a
			>
		</h1>

		{#if loroDoc}
			<RangeSlider
				name="range-slider"
				bind:value={showVersion}
				min={1}
				max={changeTimestamps.length}
				step={1}
				ticked
			></RangeSlider>

			<div class="flex flex-col gap-8">
				<div
					class="prose relative mx-auto w-full max-w-[1000px] pt-4 dark:prose-invert prose-a:text-blue-400"
				>
					{@html renderMarkdownSanitized(markdown)}
				</div>
			</div>
		{:else}
			<div class="m-auto p-20">
				<ProgressRadial meter="stroke-primary-500" track="stroke-primary-500/30" />
			</div>
		{/if}
	</div>
</main>
