<script lang="ts">
	import type { ActionData } from './$types';
	import { pow_work_wasm } from '$lib/spow/spow-wasm';
	import { get_pow_challenge } from '$lib/rauthy/client';

	export let form: ActionData;

	let processing = false;
	let error: string | undefined = form?.message;

	async function handleSubmit(event: SubmitEvent) {
		processing = true;
		event.preventDefault();
		const form: HTMLFormElement = event.target as any;

		let challenge = await get_pow_challenge();
		console.debug('Computing proof of work');
		let pow = await pow_work_wasm(challenge);
		console.debug('Completed proof of work');
		if (!pow) {
			error = 'Error computing proof of work, you may need a browser update.';
			processing = false;
			return;
		} else {
			(form.elements.namedItem('pow') as any).value = pow;
		}

		form.submit();
	}
</script>

<main class="flex flex-col items-center">
	<form
		method="post"
		class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8"
		onsubmit={handleSubmit}
	>
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
			Already have an account? <a href="/account/login" class="underline">Login</a>.
		</p>

		<button class="variant-filled btn" disabled={processing}>
			{processing ? 'Loading...' : 'Register'}
		</button>
	</form>
</main>
