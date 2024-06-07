<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
</script>

{#if data.profile}
	<main class="flex flex-col items-center">
		<div class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8 text-xl">
			<div class="flex items-center gap-4">
				<Avatar username={data.profile.avatar_seed || ''} />
				<h1 class="my-3 text-4xl">{data.profile.username}</h1>
			</div>
		</div>
	</main>
{/if}
