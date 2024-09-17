<script lang="ts">
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	let links = data.links;
</script>

<div class="mx-auto max-w-xl py-12">
	<section class="mt-8">
		<div class="flex flex-col items-center gap-4">
			{#each links as link}
				<a
					target="_blank"
					href={link.url}
					class="relative w-full rounded-full border-2 px-2 py-4 text-center font-medium transition duration-300 hover:bg-white hover:text-black"
				>
					{link.label ? link.label : link.url}
				</a>
			{/each}
		</div>
	</section>
</div>
