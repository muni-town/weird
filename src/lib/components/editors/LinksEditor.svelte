<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { importLinksFromOPMLFile } from '$lib/utils/import-opml';
	import {
		SortableItem,
		SortableList,
		type SortEventDetail
	} from '@rodrigodagostino/svelte-sortable-list';
	import { Handle } from '@rodrigodagostino/svelte-sortable-list';
	import { IconHandle } from '@rodrigodagostino/svelte-sortable-list';

	let {
		links = $bindable(),
		...attrs
	}: { links: { label?: string; url: string }[] } & HTMLAttributes<HTMLDivElement> = $props();

	let newLabel = $state('');
	let newUrl = $state('');

	let ids: Map<object, string> = $state(new Map());

	function getId(link: object): string {
		let id = ids.get(link);
		if (!id) {
			id = Math.random().toString(16);
			ids.set(link, id);
		}
		return id;
	}

	let error = $state('');

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex: from, nextItemIndex: to } = event.detail;
		let clone = [...links];
		clone.splice(to < 0 ? clone.length + to : to, 0, clone.splice(from, 1)[0]);
		links = clone;
	}

	async function fetchURL() {
		error = '';
		try {
			const url = new URL(newUrl);
			if (url) {
				const resp = await fetch(`/api/links?url=${newUrl}`);
				const htmlData = await resp.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlData, 'text/html');
				const title = doc.querySelector('title')?.innerText;
				if (!title) {
					error = 'Title not found';
				}
				newLabel = title ?? '';
			}
		} catch (err: any) {
			error = 'Invalid link';
		}
	}

	$effect(() => {
		if (newUrl) {
			fetchURL();
		}
	});
</script>

<div class="flex flex-col" {...attrs}>
	<button
		class="variant-ghost-surface btn mb-4 w-max self-start"
		title="Import links from OPML"
		onclick={async () => {
			const linksFromOPML = await importLinksFromOPMLFile();
			links = [...links, ...linksFromOPML];
		}}>Import links from OPML</button
	>
	<form
		class="mb-4 flex items-center gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			links = [...links, { label: newLabel, url: newUrl }];
			newLabel = '';
			newUrl = '';
		}}
	>
		<div class="flex flex-grow flex-col items-center justify-center">
			{#if newLabel}
				<input class="input mb-2" placeholder="Label" bind:value={newLabel} />
			{/if}
			<input required class="input" placeholder="Url" bind:value={newUrl} />
			<div class="text-sm text-error-400">{error}</div>
		</div>

		<div class="flex items-center">
			<button title="Add Link" class="variant-ghost-surface btn">Add link</button>
		</div>
	</form>

	<ul class="mb-4 flex flex-col items-center gap-2">
		<SortableList on:sort={handleSort}>
			{#each links as link, index (getId(link))}
				<SortableItem id={getId(link)} {index}>
					<li class="flex w-full items-center justify-center gap-2">
						<Handle>
							<IconHandle />
						</Handle>
						<a class="variant-ghost btn" target="_blank" href={link.url}>
							{link.label}
						</a>

						<button
							class="variant-ghost btn-icon btn-icon-sm"
							title="Delete link"
							onclick={() => links.splice(index, 1)}>x</button
						>
					</li>
				</SortableItem>
			{/each}
			{#if links.length == 0}
				<div class="mt-3">No Links</div>
			{/if}
		</SortableList>
	</ul>
</div>
