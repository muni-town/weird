<script lang="ts">
	let msg = $state('');
	const Authenticate = () => {
		const discord_id = new URLSearchParams(window.location.search).get('q');
		const form_data = new FormData();
		form_data.append('discord_id', discord_id!);
		fetch(window.location.href, {
			method: 'POST',
			body: form_data
		}).then((response) => {
			if (response.ok) {
				msg = 'Access granted successfully. You can now close this tab.';
			}
		});
	};
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="color-scheme" content="light dark" />
	<link rel="stylesheet" href="/pico.min.css" />
</svelte:head>

<div class="container">
	{#if msg}
		<p class="text-green-700">{msg}</p>
	{/if}
	<p>
		You are about to granting weird bot access to your account. This will allow the bot to add links
		to your account. Click the button below if you are sure you want to proceed.
	</p>
	<button
		class="my-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		onclick={Authenticate}>Grant Access</button
	>
</div>

<style>
	.container {
		padding: 2rem;
	}
</style>
