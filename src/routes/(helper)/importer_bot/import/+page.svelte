<script lang="ts">
	const GenerateToken = () => {
		console.log('aaa');
	};
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="color-scheme" content="light dark" />
	<link rel="stylesheet" href="pico.min.css" />
</svelte:head>

<div class="container">
	<p>
		You are about to granting linkblocks bot access to your account. This will allow the bot to add
		links from your account. Click the button below if you are sure you want to proceed.
	</p>
	<button
		onclick={GenerateToken}
		class="my-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		>Grant access</button
	>
</div>

<style>
	.container {
		padding: 2rem;
	}
</style>
