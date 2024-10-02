<script lang="ts">
	interface props {
		handleSubmit: (event: SubmitEvent) => void;
		processing: boolean;
		error: string | null;
		powResult: string;
	}

	import { env } from '$env/dynamic/public';

	const { processing, error, handleSubmit, powResult }: props = $props();
	const instaceName = env.PUBLIC_INSTANCE_NAME;
</script>

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
		If you're having trouble or you have feedback for {instaceName} we'd appreciate a message, good or
		bad, let us know!
	</p>

	<label class="label">
		<span>Email <span class="text-surface-500-400-token text-sm">( optional )</span></span>
		<input class="input" type="text" name="email" placeholder="Email" />
		<div class="text-surface-500-400-token ml-4 text-sm">
			If you specify an email we may get back to you.
		</div>
	</label>

	<label class="label">
		<span>Message</span>
		<textarea name="content" class="textarea" placeholder="Send us a message..." rows="5">
		</textarea>
	</label>
	<input type="hidden" name="pow" value={powResult} />

	<button class="variant-filled btn" type="submit" disabled={processing}>
		{processing ? 'Sending...' : 'Send'}
	</button>
</form>
