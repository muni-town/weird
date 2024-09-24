<script lang="ts">
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import type { PageData } from './$types';
	import _ from 'underscore';

	const { data }: { data: PageData } = $props();
	const profile = data.profile;
	const pages = data.pages;
</script>

<svelte:head>
	<title>Profile Pages | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

{#if data.sessionInfo && profile}
	<h1 class="my-3 flex justify-between text-3xl font-bold">
		Pages

		<a class="variant-ghost btn-icon btn-sm" href="/account/pages/new">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				fill="currentColor"
				class="bi bi-plus"
				viewBox="0 0 16 16"
			>
				<path
					d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"
				/>
			</svg>
		</a>
	</h1>

	<nav class="list-nav">
		<!-- (optionally you can provide a label here) -->
		<ul>
			{#each pages as page}
				<li class="text-lg">
					<a href={`/account/pages/edit/${page}`}>
						<span class="flex-auto font-mono">{page}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
