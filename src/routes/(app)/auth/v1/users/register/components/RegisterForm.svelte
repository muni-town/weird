<script lang="ts">
	interface props {
		error: string;
		processing: boolean;
		onsubmit: (event: SubmitEvent) => void;
	}

	const { error, processing, onsubmit }: props = $props();
</script>

<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" {onsubmit}>
	{#if error}
		<div class="rounded-sm bg-error-500 p-3">
			Error registering user: {error}
		</div>
	{/if}
	<h1 class="my-3 text-2xl">Register New Account</h1>
	<label class="label">
		<span>Email</span>
		<input name="email" class="input" type="text" placeholder="Email" />
	</label>
	<input type="hidden" name="pow" value="" />

	<p class="mt-4">
		Already have an account? <a href="/my-profile" class="underline">Login</a>.
	</p>

	<button class="variant-filled btn" disabled={processing}>
		{processing ? 'Loading...' : 'Register'}
	</button>
</form>
