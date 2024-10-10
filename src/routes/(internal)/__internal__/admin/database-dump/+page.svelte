<script lang="ts">
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

<p>Dump the database or restore from a database dump.</p>

<h2>Create Database Dump</h2>

<form method="post" action="/__internal__/admin/database-dump/download">
	<button>Download Dump</button>
	<a role="button" href="/__internal__/admin/database-dump/view">View Debug Dump</a>
</form>

<h2>Restore Database Dump</h2>

{#if form?.error}
	<article class="pico-background-red-550">
		{form.error}
	</article>
{:else if form?.message}
	<article class="pico-background-green-350">
		{form.message}
	</article>
{/if}

<form
	method="post"
	action="/__internal__/admin/database-dump?/restore"
	enctype="multipart/form-data"
>
	<input type="file" name="dump" />
	<button>Restore Dump</button>
</form>
