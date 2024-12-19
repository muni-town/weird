<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		search = $bindable(''),
		...textinputProps
	}: { search: string } & HTMLAttributes<HTMLInputElement> = $props();

	let searchBox: HTMLInputElement;

	const setSearch = (e: MouseEvent, s: string) => {
		e.preventDefault();
		search = s;
		searchBox.focus();
	};
</script>

<div class="input-group w-full max-w-sm grid-cols-[auto_1fr_auto]">
	<div class="input-group-cell">
		<Icon icon="iconamoon:search-bold" />
	</div>
	<input
		bind:this={searchBox}
		type="search"
		placeholder="Search..."
		bind:value={search}
		{...textinputProps}
	/>
	<button class:invisible={search.length == 0} onclick={(e) => setSearch(e, '')}>x</button>
</div>
