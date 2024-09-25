<script lang="ts">
	import { renderMarkdownSanitized } from '$lib/utils.js';
	import { marked } from 'marked';

	export let data;
</script>

<div class="prose mx-auto max-w-2xl overflow-x-auto px-4 py-12 dark:prose-invert">
	{@html renderMarkdownSanitized(data.repo)}
</div>
