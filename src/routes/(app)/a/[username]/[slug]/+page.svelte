<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const username = data.username.includes('@') ? data.username.split('@')[0] : data.username;
</script>

<main class="flex flex-col items-center">
	<h1 class="mt-12 font-mono text-2xl">
		<a class="text-blue-600" href={`/a/${data.username}`}>{username}</a> / {data.slug}
	</h1>
	<div class="card prose mt-8 p-8 dark:prose-invert" style="width: 800px; max-width: 90%">
		{@html data.html}
	</div>
</main>
