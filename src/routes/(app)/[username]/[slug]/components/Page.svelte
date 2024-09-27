<script lang="ts">
	import type { PageData } from '../$types';

	import PageHeader from './Header.svelte';
	import PageContent from './Content.svelte';
	import PageLinks from './Links.svelte';

	const { slug, username, links, html, pageName }: PageData = $props();
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<PageHeader {username} {slug} />
	<PageContent {html} />
	<PageLinks {links} />
</main>
