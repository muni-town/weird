<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { Snippet } from 'svelte';
	import _ from 'underscore';

	const { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>Profile Pages | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex items-start justify-center pt-12">
	<!-- TODO: Abstract This Sidebar into a Nested Layout Shared with the Profile Page -->
	<section class="card mx-4 px-5 py-4">
		<h2 class="text-lg font-bold">Pages</h2>

		<ol class="list-nav mt-4 flex flex-col gap-2">
			<li>
				<a href="/auth/v1/account"> Profile </a>
			</li>
			<li>
				<a href={`/account/pages`} class="variant-outline"> Pages </a>
			</li>
		</ol>
	</section>

	<div class="content card mx-6 flex w-[90%] flex-col gap-4 p-8 text-xl">
		{@render children()}
	</div>
</main>
