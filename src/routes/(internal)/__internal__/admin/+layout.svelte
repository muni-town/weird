<script lang="ts">
	import type { Snippet } from 'svelte';
	const { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href="/pico.min.css" />
	<link rel="stylesheet" href="/pico.colors.min.css" />
</svelte:head>

<header class="container" style="margin-top: 4em">
	<hgroup>
		<h1>Weird Admin Pages</h1>
		<p>Special administration pages for the Weird app, you admin you.</p>
	</hgroup>
	<nav>
		<ul>
			<li><a href="/__internal__/admin" data-theme-switcher="auto">Admin Home</a></li>
			<li><a href="/" data-theme-switcher="auto">Weird Home</a></li>
		</ul>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>
