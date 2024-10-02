<script lang="ts">
	const ACTION = '?/claimUsername';

	const {
		error
	}: {
		error: string | undefined;
	} = $props();
</script>

<form class="card m-8 flex flex-col gap-4 p-6" method="post" action={ACTION}>
	<h1 class="text-2xl font-bold">Claim Username</h1>

	{#if error}
		<aside class="alert variant-ghost-error w-80">
			<div class="alert-message">
				<p>{error}</p>
			</div>
		</aside>
	{/if}

	<p>Choose a username for your new Weird profile!</p>
	<input class="input" name="username" placeholder="username" />
	<button class="variant-ghost btn">Claim</button>
</form>
