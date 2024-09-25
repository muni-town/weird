<script lang="ts">
	import type { Snippet } from 'svelte';
	const { children }: { children: Snippet } = $props();
</script>

<main class="flex max-w-full flex-col items-center">
	{@render children()}
</main>
