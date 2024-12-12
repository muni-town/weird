<script lang="ts">
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

{#if form?.error}
	<article class="pico-background-red-550">
		{form.error}
	</article>
{:else if form?.success}
	<article class="pico-background-green-550">
		{form.success}
	</article>
{/if}

<h2>Send Email From Weird</h2>

<p>
	Set recipient to <code>___everyone___</code> to send an email to all users with a username set.
</p>

<form method="post" action="?/sendEmail">
	<input name="recipient" placeholder="recipient" />
	<input name="subject" placeholder="subject" />
	<textarea name="bodyMarkdown" placeholder="Markdown body"></textarea>
	<button>Send</button>
</form>
