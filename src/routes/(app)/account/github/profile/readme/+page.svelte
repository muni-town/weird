<script lang="ts">
	import { marked } from 'marked';

	export let data;
</script>

<div class="prose mx-auto max-w-2xl overflow-x-auto px-4 py-12 dark:prose-invert">
	{@html marked.parse(data.repo)}
</div>
