<script lang="ts">
	import {
		SortableItem,
		SortableList,
		sortItems,
		type SortEventDetail
	} from '@rodrigodagostino/svelte-sortable-list';
	import { Handle } from '@rodrigodagostino/svelte-sortable-list';
	import { IconHandle } from '@rodrigodagostino/svelte-sortable-list';

	type Page = {
		slug: string;
		name?: string;
	};
	let { pages: _pages = $bindable() }: { pages: Page[] } = $props();
	let pages = $state.raw(_pages);

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex: from, nextItemIndex: to } = event.detail;
		pages = sortItems(pages, from, to);
		_pages = pages;
	}
</script>

<div>
	<h2 class="mb-4 text-center font-rubik text-2xl font-bold">Pages</h2>
	<div class="mt-6 items-center gap-10">
		<SortableList
			direction="vertical"
			hasBoundaries={true}
			hasLockedAxis={true}
			gap={12.75}
			on:sort={handleSort}
		>
			{#each pages as p, index (p.slug)}
				<SortableItem id={p.slug} {index}>
					<div class="flex w-full items-center justify-center gap-2">
						<div class="link">
							{p.name || p.slug}
						</div>
						<Handle>
							<IconHandle />
						</Handle>
					</div>
				</SortableItem>
			{/each}
		</SortableList>
	</div>
</div>

<style>
	.link {
		color: black;
		font-family: 'Rubik Mono One';
		background-color: #a092e3;
		padding: var(--size-fluid-1) var(--size-fluid-2);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-2);
		box-shadow: 0.35rem 0.45rem black;
		text-decoration: none;
		text-align: center;
	}
</style>
