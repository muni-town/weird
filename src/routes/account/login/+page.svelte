<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<main class="flex flex-col items-center">
	<form method="POST" class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		<h1 class="my-3 text-2xl">Login</h1>
		{#if data.hasReset}
			<aside class="alert variant-ghost-success">
				<div class="alert-message">
					Your password was reset, you can now login with your new password.
				</div>
			</aside>
		{/if}
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="text" placeholder="Email" />
		</label>
		<label class="label">
			<span>Password</span>
			<input name="password" class="input" type="password" placeholder="Password" />
		</label>

		{#if !data.hasReset}
			<p class="mt-4">
				Don't have an account?
				<a href="/account/register" class="underline">Register a new account</a>.
			</p>
		{/if}

		<button class="variant-filled btn mt-4"> Login </button>
	</form>
</main>
