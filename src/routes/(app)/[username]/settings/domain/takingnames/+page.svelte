<script lang="ts">
	import { env } from '$env/dynamic/public';
	import * as namedrop from 'namedrop-js';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let error: string | undefined = $state();

	onMount(async () => {
		const client = await namedrop.checkAuthFlow();
		if (!client) {
			await namedrop.startAuthFlow({
				scopes: ['namedrop-hosts']
			});
			return;
		}

		try {
			const newDomain = `${client.host}${client.host ? '.' : ''}${client.domain}`;

			let records = (await client.getRecords()).filter((x) => x.host == client.host);
			await client.deleteRecords({
				domain: client.domain,
				host: client.host,
				records
			});
			await client.setRecords({
				domain: client.domain,
				host: client.host,
				records: [
					{
						type: client.host ? 'CNAME' : 'ANAME',
						value: env.PUBLIC_DOMAIN
					}
				]
			});

			window.location.href = `/${$page.params.username}/settings/domain?newDomain=${encodeURIComponent(newDomain)}`;
		} catch (e: any) {
			error = e.toString();
		}
	});
</script>

<svelte:head>
	<title>Taking Names | Domain Management | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="mx-4 flex w-full flex-col items-center">
	<div class="card m-4 mt-12 flex w-full max-w-[700px] flex-col gap-4 p-8 text-xl">
		<h1 class="my-3 text-3xl font-bold">Connecting to TakingNames...</h1>

		{#if error}
			<aside class="alert variant-ghost-error">
				<div class="alert-message">
					<p>{error}</p>
				</div>
			</aside>
		{/if}
	</div>
</main>
