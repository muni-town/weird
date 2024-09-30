<script lang="ts">
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

<div class="input-group input-group-divider mt-8 max-w-80 grid-cols-[1fr_auto]">
	<input
		bind:this={searchBox}
		type="text"
		class="input"
		placeholder="Search..."
		bind:value={search}
		{...textinputProps}
	/>
	<button class:invisible={search.length == 0} onclick={(e) => setSearch(e, '')}>x</button>
</div>
