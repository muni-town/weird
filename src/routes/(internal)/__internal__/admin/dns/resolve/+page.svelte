<script lang="ts">
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

<p>Debugging tool to resolve a domain on the Weird server.</p>

{#if form?.data}
	<pre style="padding: 1em;">{JSON.stringify(form.data, null, '  ')}</pre>
{/if}

{#if form?.error}
	<article class="pico-background-red-550">
		{form.error}
	</article>
{/if}

<form method="post">
	<select name="kind">
		<option value="A">A</option>
		<option value="TXT">TXT</option>
	</select>
	<input name="domain" placeholder="domain.test" />

	<button>Resolve</button>
</form>
