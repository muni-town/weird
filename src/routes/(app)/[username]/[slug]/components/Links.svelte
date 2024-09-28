<script lang="ts">
	import type { PageData } from '../$types';
	interface Props {
		links: PageData['links'];
	}

	const { links }: Props = $props();
</script>

{#if links}
	<h3 class="mb-4 mt-8 text-center text-2xl font-bold">Links</h3>
	{#each links as link}
		<a class="variant-ghost btn" target="_blank" href={link.url}>
			{link.label || link.url}
		</a>
	{/each}
{/if}
