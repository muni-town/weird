<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="flex flex-col items-center gap-4 p-8">
	<h1 class="text-4xl font-bold">{$page.status}</h1>
	<h2 class="text-3xl font-semibold">
		{$page.error?.message}
	</h2>

	<div class="mt-8 flex gap-4">
		<a class="variant-ghost btn" href="/">Home</a>
		<a class="variant-ghost btn" href="/my-profile">Your Profile</a>
	</div>
</main>
