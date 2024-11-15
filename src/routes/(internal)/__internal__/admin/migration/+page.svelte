<script lang="ts">
	import { base32Encode } from 'leaf-proto';
	import type { ActionData, PageData } from './$types';

	const { form, data }: { form: ActionData; data: PageData } = $props();
</script>

{#if form?.error}
	<article class="pico-background-red-550">
		{form.error}
	</article>
{:else if form?.dump}
	<article>
		<pre>

		{form.dump}
		</pre>
	</article>
{/if}

<h2>Dump Migration ( Dry Run )</h2>

<form method="post" action="?/dump">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<button>Dump</button>
	</fieldset>
</form>

<h2>Do Migration</h2>

<form method="post" action="?/do">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<button>Do</button>
	</fieldset>
</form>
