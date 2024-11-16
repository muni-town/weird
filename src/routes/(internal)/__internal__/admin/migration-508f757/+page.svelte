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

<h2>Migrate Database</h2>

<p>
	Upload a dump of the previous version of the database and it will be imported and migrated to the
	new version.
</p>

<p>
	Below you can see the commits for the previous version of Weird that we are migrating from, and
	the commit after that which includes the newer data model that we are migrating to.
</p>

<table>
	<thead>
		<tr>
			<td>Previous Version Commit</td>
			<td>Current Version Commit</td>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>
				<a href="https://github.com/muni-town/weird/commit/e291612d36be303eecbe136967c39fa5e2b6af5a"
					>e291612d36be303eecbe136967c39fa5e2b6af5a</a
				>
			</td>
			<td>
				<a
					href="https://github.com/muni-town/weird/commit/508f757686d3ca20fa5b8b4a29b09c2fe992b4a3"
				>
					508f757686d3ca20fa5b8b4a29b09c2fe992b4a3
				</a>
			</td>
		</tr>
	</tbody>
</table>

<form method="post" action="?/migrate" enctype="multipart/form-data">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<input name="subspaceId" placeholder="subspaceId" />
	<input type="file" name="dump" accept=".bin" />
	<button>Migrate</button>
</form>
