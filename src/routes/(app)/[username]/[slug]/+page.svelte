<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const username = data.username.includes('@') ? data.username.split('@')[0] : data.username;
</script>

<svelte:head>
	{#if data.pageName}
		<title>{data.pageName} | {env.PUBLIC_INSTANCE_NAME}</title>
	{/if}
</svelte:head>

<main class="flex flex-col items-center">
	<h1 class="mt-12 font-mono text-2xl">
		<a class="text-blue-600" href={`/${data.username}`}>{username}</a> / {data.slug}
	</h1>
	{#if data.html}
		<div class="card prose mt-8 p-8 dark:prose-invert" style="width: 800px; max-width: 90%">
			{@html data.html}
		</div>
	{/if}

	{#if data.links}
		<h3 class="mb-4 mt-8 text-center text-2xl font-bold">Links</h3>
		{#if data.links.length > 0}
			{#each data.links as link}
				<a class="variant-ghost btn" target="_blank" href={link.url}>
					{link.label || link.url}
				</a>
			{/each}
		{:else}
			No links
		{/if}
	{/if}
</main>
