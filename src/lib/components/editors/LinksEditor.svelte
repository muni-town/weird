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
	import SocialMediaButton from '../social-media/social-media-button.svelte';
	import { debounce } from 'underscore';

	let {
		links = $bindable(),
		...attrs
	}: { links: { label?: string; url: string }[] } & HTMLAttributes<HTMLDivElement> = $props();

	let newLink = $state({ label: '', url: '' });

	let ids: Map<object, string> = $state(new Map());

	function getId(link: object): string {
		let id = ids.get(link);
		if (!id) {
			id = Math.random().toString(16);
			ids.set(link, id);
		}
		return id;
	}

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex: from, nextItemIndex: to } = event.detail;
		let clone = [...links];
		clone.splice(to < 0 ? clone.length + to : to, 0, clone.splice(from, 1)[0]);
		links = clone;
	}

	let fetchingUrl = $state(false);
	const fetchURL = debounce(async () => {
		const url = new URL(newLink.url);
		if (url) {
			const resp = await fetch(`/api/links?url=${newLink.url}`);
			if (resp.status == 200) {
				const htmlData = await resp.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlData, 'text/html');
				const title = doc.querySelector('title')?.innerText;
				if (!title || title.startsWith('ERROR')) {
					newLink.label = '';
				}
				newLink.label = title ?? '';
			}
		}
		fetchingUrl = false;
	}, 500);
	$effect(() => {
		if (newLink.url && !newLink.label) {
			fetchingUrl = true;
			fetchURL();
		}
	});

	$effect(() => {
		if (newLink.url.length > 0 && !links.includes(newLink)) {
			links = [...links, newLink];
		} else if (newLink.url.length == 0 && links.includes(newLink)) {
			links = links.filter((x) => x !== newLink);
		}
	});

	function host(url: string): string | undefined {
		try {
			return new URL(url).host;
		} catch (_) {}
	}
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
			newLink = { label: '', url: '' };
		}}
	>
		<div class="flex flex-grow flex-col items-center justify-center gap-2">
			<label class="flex w-full flex-row items-center gap-2">
				<span class="w-16">Url</span>
				<input required class="input" placeholder="Url" bind:value={newLink.url} />
			</label>
			<label class="flex w-full flex-row items-center gap-2">
				<span class="w-16">Label</span>
				<input
					class="input"
					placeholder={fetchingUrl ? 'Label ( auto-filling )' : 'Label'}
					bind:value={newLink.label}
				/>
			</label>
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
						<SocialMediaButton url={link.url} label={link.label || host(link.url)} />

						<button
							class="variant-ghost btn-icon btn-icon-sm"
							title="Delete link"
							onclick={() => {
								const l = links.splice(index, 1)[0];
								if (l == newLink) {
									newLink = { label: '', url: '' };
								}
							}}>x</button
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
