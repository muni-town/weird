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
	import { debounce } from 'underscore';
	import { untrack } from 'svelte';

	let {
		links = $bindable(),
		...attrs
	}: { links: { label?: string; url: string }[] } & HTMLAttributes<HTMLDivElement> = $props();

	const EMPTY = { url: '', label: '' };
	// Adapted from SocialLinksEditor.svelte
	let localLinks = $state(links.concat([EMPTY])) as typeof links;
	$effect(() => {
		links = localLinks.filter((x) => !!x.url);
	});

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
		localLinks.splice(to < 0 ? localLinks.length + to : to, 0, localLinks.splice(from, 1)[0]);
	}

	/** index of currently fetching url */
	let fetchingUrl = $state(-1);
	const fetchURL = debounce(async (link: (typeof links)[number]) => {
		try {
			const url = new URL(link.url);
			if (url) {
				const resp = await fetch(`/api/links?url=${url}`);
				if (resp.status == 200) {
					const htmlData = await resp.text();
					const parser = new DOMParser();
					const doc = parser.parseFromString(htmlData, 'text/html');
					const title = doc.querySelector('title')?.innerText;
					if (!title || title.startsWith('ERROR') || !!link.label) {
						return;
					}
					link.label = title;
				}
			}
		} catch (err) {
			if (err instanceof TypeError && err.message.includes(`is not a valid URL.`)) {
				if (!link.url.startsWith('http')) {
					link.url = 'https://' + link.url;
				}
				fetchURL(link);
			} else throw err;
		} finally {
			fetchingUrl = -1;
		}
	}, 500);

	const onInput = async (link: (typeof links)[number], index: number) => {
		// TODO: this doesn't currently account for previously autofilled links if the url is changed after an autofill
		if (link.url && !link.label) {
			fetchingUrl = index;
			fetchURL(link);
		}
		if (link.url === '') {
			localLinks = localLinks.filter((_, i) => i !== index);
		}
	};

	$effect(() => {
		const lastLink = localLinks[localLinks.length - 1];
		if (!lastLink || lastLink.url !== '') {
			untrack(() => {
				localLinks.push(EMPTY);
			});
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

	<div class="mb-4 flex flex-col">
		<SortableList
			direction="vertical"
			hasBoundaries={true}
			hasLockedAxis={true}
			gap={0.5}
			on:sort={handleSort}
		>
			{#each localLinks as link, index (getId(link))}
				{@const isLast = index === localLinks.length - 1}
				<SortableItem id={getId(link)} {index} isLocked={isLast}>
					<div class="flex w-full items-center justify-center gap-2">
						<div
							class="mb-4 flex w-full w-full flex-grow flex-col items-center items-center justify-center gap-2 gap-2 gap-2"
						>
							<label class="items-left flex w-full flex-col gap-2">
								<span class="text-sm font-semibold">Url</span>
								<input
									class="input"
									placeholder="https://example.com"
									oninput={() => onInput(link, index)}
									bind:value={link.url}
								/>
							</label>
							<label class="items-left flex w-full flex-col gap-2">
								<span class="text-sm font-semibold">Label</span>
								<input
									class="input"
									placeholder={fetchingUrl === index ? 'Label ( auto-filling )' : 'My Title'}
									bind:value={link.label}
								/>
							</label>
						</div>
						{#if localLinks.length > 2 && !isLast}
							<Handle>
								<IconHandle />
							</Handle>
						{/if}
					</div>
				</SortableItem>
			{/each}
		</SortableList>
	</div>
</div>
