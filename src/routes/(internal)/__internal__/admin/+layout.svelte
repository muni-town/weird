<script lang="ts">
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();
</script>

<div style="margin-bottom: 2em;">
	<a href="/">Home</a>
</div>

{@render children()}
