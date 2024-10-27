<script lang="ts">
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

<p>Debugging tool to set DNS records on the Weird server.</p>

<!-- {#if form?.data}
	<pre style="padding: 1em;">{JSON.stringify(form.data, null, '  ')}</pre>
{/if} -->

{#if form?.error}
	<article class="pico-background-red-550">
		{form.error}
	</article>
{/if}

<form method="post">
	<select name="kind">
		<option value="TXT">TXT</option>
		<option value="A">A</option>
	</select>
	<input name="domain" placeholder="domain.test" />
	<input name="values" placeholder="Comma separated values" />

	<button>Set</button>
</form>
