<script lang="ts">
	interface props {
		success: boolean;
		onsubmit: (event: SubmitEvent) => void;
	}

	const { success, onsubmit }: props = $props();
</script>

<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" {onsubmit}>
	<h1 class="my-3 text-2xl">Forgot Password</h1>

	{#if success}
		<aside class="alert variant-ghost-success">
			<div class="alert-message">
				<p>Your password reset email has been sent. You may now close this tab.</p>
			</div>
		</aside>
	{:else}
		<p>If you forgot your password, we can send you an email with a reset link.</p>
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="email" placeholder="Email" />
		</label>

		<button class="variant-filled btn"> Send Link</button>
	{/if}
</form>
