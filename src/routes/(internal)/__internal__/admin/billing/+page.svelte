<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { UserSubscriptionInfo } from '$lib/billing';
	import { format } from 'timeago.js';

	function formatSubscriptionInfo(info: UserSubscriptionInfo): string {
		let message = info.isSubscribed ? 'Subscribed' : 'Unsubscribed';
		if (info.freeTrialExpirationDate) {
			message += `${message ? ' & ' : ''}Free Trial expires ${format(info.freeTrialExpirationDate)}`;
		}
		return message;
	}

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

<h2>Grant Free Trial</h2>

<p>Set rauthy ID to <code>___everyone___</code> to give everybody with a username a free trial.</p>

<form method="post" action="?/grantFreeTrial">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<input name="rauthyId" placeholder="rauthyId" />
		<input type="datetime-local" name="expires" />
		<button>Grant</button>
	</fieldset>
</form>

<h2>Cancel Free Trial</h2>

<form method="post" action="?/cancelFreeTrial">
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<fieldset role="group">
		<input name="rauthyId" placeholder="rauthyId" />
		<button>Delete</button>
	</fieldset>
</form>

<h2>Users</h2>

<table>
	<thead>
		<tr>
			<td>Username</td>
			<td>Rauthy ID</td>
			<td>Subscription</td>
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
				<td>{user.rauthyId}</td>
				<td>
					{formatSubscriptionInfo(user.subscriptionInfo)}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
