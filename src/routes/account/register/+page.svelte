<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<main class="flex flex-col items-center">
	<form method="post" class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		{#if form?.message}
			<div class="rounded-sm bg-error-500 p-3">
				Error registering user: {form.message}
			</div>
		{/if}
		<h1 class="my-3 text-2xl">Register New Account</h1>
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="text" placeholder="Email" />
		</label>

		<p class="mt-4">
			Already have an account? <a href="/account/login" class="underline">Login</a>.
		</p>

		<button class="variant-filled btn"> Register </button>
	</form>
</main>
