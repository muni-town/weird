<script lang="ts">
	import type { PageData } from '../$types';

	import Header from './Header.svelte';
	import Content from './Content.svelte';
	import Links from './Links.svelte';

	const { slug, username, links, html, pageName }: PageData = $props();
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<Header {username} {slug} />
	<Content {html} />
	<Links {links} />
</main>
