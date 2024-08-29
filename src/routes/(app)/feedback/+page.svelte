<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Pow } from '$lib/pow';
	import { checkResponse } from '$lib/utils';

	let email = $state('');
	let message = $state('');
	let processing = $state(false);
	let error: string | null = $state(null);

	let powInput: HTMLInputElement;

	async function get_pow_challenge() {
		const resp = await fetch('/feedback/pow');
		checkResponse(resp);
		return await resp.text();
	}

	async function handleSubmit(event: SubmitEvent) {
		processing = true;
		event.preventDefault();
		try {
			// TODO: add proof-of-work challenge for feedback form.
			let challenge = await get_pow_challenge();
			console.debug('Computing proof of work', challenge);
			powInput.value = Pow.work(challenge) || '';
			console.debug('Completed proof of work', powInput.value);
			if (powInput.value == '') {
				processing = false;
				throw 'Error computing proof of work, you may need a browser update.';
			}
			(event.target! as HTMLFormElement).submit();
		} catch (e) {
			processing = false;
			error = `${e}`;
		}
	}
</script>

<svelte:head>
	<title>Feedback | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<form
		class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8"
		method="post"
		onsubmit={handleSubmit}
	>
		<h1 class="my-3 text-center text-2xl">Leave Feedback or Request Help</h1>

		{#if error}
			<div class="rounded-sm bg-error-500 p-3">
				Error submitting feedback: {error}
			</div>
		{/if}

		<p class="text-surface-500-400-token text-center">
			If you're having trouble or you have feedback for {env.PUBLIC_INSTANCE_NAME} we'd appreciate a
			message, good or bad, let us know!
		</p>

		<label class="label">
			<span>Email <span class="text-surface-500-400-token text-sm">( optional )</span></span>
			<input class="input" type="text" name="email" placeholder="Email" bind:value={email} />
			<div class="text-surface-500-400-token ml-4 text-sm">
				If you specify an email we may get back to you.
			</div>
		</label>

		<label class="label">
			<span>Message</span>
			<textarea
				name="content"
				class="textarea"
				placeholder="Send us a message..."
				rows="5"
				bind:value={message}
			>
			</textarea>
		</label>
		<input type="hidden" name="pow" bind:this={powInput} />

		<button class="variant-filled btn" type="submit" disabled={processing}>
			{processing ? 'Sending...' : 'Send'}
		</button>
	</form>
</main>
