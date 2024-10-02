<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
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
	}: { links: { label?: string; url: string; id: string }[] } & HTMLAttributes<HTMLDivElement> =
		$props();

	let newLabel = $state('');
	let newUrl = $state('');

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex: from, nextItemIndex: to } = event.detail;
		let clone = [...links];
		clone.splice(to < 0 ? clone.length + to : to, 0, clone.splice(from, 1)[0]);
		links = clone;
	}
</script>

<div class="flex flex-col" {...attrs}>
	<form
		class="mb-4 flex flex-row gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			links = [...links, { label: newLabel, url: newUrl, id: Math.random().toString() }];
			newLabel = '';
			newUrl = '';
		}}
	>
		<input class="input" placeholder="Label" bind:value={newLabel} />
		<input class="input" placeholder="Url" bind:value={newUrl} />
		<button title="Add Link" class="variant-ghost-surface btn btn-icon flex-shrink-0 text-2xl"
			>+</button
		>
	</form>

	<ul class="mb-4 flex flex-col items-center gap-2">
		<SortableList on:sort={handleSort}>
			{#each links as link, index (link.id)}
				<SortableItem id={link.id} {index}>
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
		</SortableList>
	</ul>
</div>
