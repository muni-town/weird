<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	type Props = {
		children: Snippet;
		summary: Snippet;
		name?: HTMLDetailsElement['name'];
		/** class name string for snippet tag*/
		sClass?: string;
		/** class name string for contents div */
		cClass?: string;
	};
	let { children, summary, sClass = '', name, cClass = '' }: Props = $props();
	let open = $state(false);
</script>

<details {name} class="border-none" bind:open>
	<summary class={sClass}>
		{@render summary()}
	</summary>
	{#if open}
		<div class={cClass} transition:slide={{ duration: 100 }}>
			{@render children()}
		</div>
	{/if}
</details>
