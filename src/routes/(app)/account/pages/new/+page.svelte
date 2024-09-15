<script lang="ts">
	import { goto } from '$app/navigation';

	let slug = $state('');
	let disabled = $state(true);

	$effect(() => {
		disabled = slug.length <= 0;
	});
</script>

<h1 class="text-3xl">Create Page</h1>

<p class="text-md">Select a unique path for your page</p>

<form
	onsubmit={async (e) => {
		e.preventDefault();
		await goto(`/account/pages/edit/${slug}`);
	}}
>
	<input class="input mb-2" bind:value={slug} placeholder="page-slug" />

	<div class="flex justify-end">
		<button {disabled} type="submit" class="variant-ghost btn">Create</button>
	</div>
</form>
