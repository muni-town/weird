<script lang="ts">
	import type { PostItem } from '$lib/types/rss';
	import Icon from '@iconify/svelte';
	import { formatDistanceToNow } from 'date-fns';

	export let post: PostItem;
</script>

<a href={post.link} target="_blank" class="card card-hover">
	<main class="p-4">
		<h3 class=" text-lg font-bold">{post.title}</h3>
		<div class="mt-2 flex items-center gap-1">
			<span class="opacity-75"><Icon icon="mdi:calendar" class="h-4 w-4" /></span>
			<span class="text-base opacity-70">{formatDistanceToNow(post.pubDate)}</span>
		</div>
		<div class="mt-2 line-clamp-3 text-base opacity-70">
			{@html post.description}
		</div>

		<ul class="mt-2 flex flex-wrap items-center gap-4">
			{#each post.category as category}
				<li>
					<span class="variant-filled badge">{category}</span>
				</li>
			{/each}
		</ul>
	</main>
</a>
