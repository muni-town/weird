<script lang="ts">
	import { base32Encode } from 'leaf-proto';
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

<h2>Generate Initial Usernames for All Users</h2>

<form method="post" action="?/generateInitialUsernames">
	<button>Generate</button>
</form>

<h2>Users</h2>

<table>
	<thead>
		<tr>
			<td>Username</td>
			<td>Initial Username</td>
			<td>Rauthy ID</td>
			<td>Subspace</td>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user}
			<tr>
				<td>
					<a href={`${user.username ? '/' + user.username : '#'}`}>
						{user.username || '[not set]'}
					</a>
				</td>
				<td>{user.initialUsername}</td>
				<td>{user.rauthyId}</td>
				<td>{base32Encode(user.subspace)}</td>
			</tr>
		{/each}
	</tbody>
</table>
