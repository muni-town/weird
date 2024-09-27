<script lang="ts">
	import type { PageData } from '../$types';
	interface Props {
		html: PageData['html'];
	}

	const { html }: Props = $props();
</script>

{#if html}
	<div class="card prose mt-8 p-8 dark:prose-invert" style="width: 800px; max-width: 90%">
		{@html html}
	</div>
{/if}
