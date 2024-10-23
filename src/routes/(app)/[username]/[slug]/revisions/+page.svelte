<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { dateFromUnixTimestamp } from '$lib/utils/time';

	const { data }: { data: PageData } = $props();
</script>

<main class="flex flex-col items-center">
	<h1 class="mb-2 mt-3 text-4xl font-bold">Revisions</h1>

	<h2 class="font-mono">
		{$page.params.username} / {$page.params.slug}
	</h2>

	<ul class="my-5 flex flex-col items-center gap-3">
		<li>
			<a class="variant-ghost btn" href={`/${$page.params.username}/${$page.params.slug}`}>
				Current
			</a>
		</li>
		{#each data.revisions as revision}
			<li>
				<a
					class="variant-ghost btn"
					href={`/${$page.params.username}/${$page.params.slug}/revisions/${revision}`}
				>
					{new Intl.DateTimeFormat(undefined, {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					}).format(dateFromUnixTimestamp(revision))}
				</a>
			</li>
		{/each}
	</ul>
</main>
