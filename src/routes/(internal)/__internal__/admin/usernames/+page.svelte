<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { form, data }: { form: ActionData; data: PageData } = $props();
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

<h2>Claim Username</h2>

<form method="post" action="?/claimUsername">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<input name="username" placeholder="username" />
		<input name="rauthyId" placeholder="rauthyId" />
		<input name="subspace" placeholder="subspace" />
		<button>Claim</button>
	</fieldset>
</form>

<h2>Delete Username</h2>

<form method="post" action="?/deleteUsername">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<input name="username" placeholder="username" />
		<button>Delete</button>
	</fieldset>
</form>

<h2>Users</h2>

<table>
	<thead>
		<tr>
			<td>Username</td>
			<td>Rauthy ID</td>
			<td>Subspace</td>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user}
			<tr>
				<td><a href={`/${user.username}`}>{user.username}</a></td>
				<td>{user.rauthyId}</td>
				<td>{user.subspace}</td>
			</tr>
		{/each}
	</tbody>
</table>
