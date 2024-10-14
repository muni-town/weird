<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import type { ActionData, PageData } from './$types';
	import _ from 'underscore';

	const { data, form }: { data: PageData; form: ActionData } = $props();
	const profile = data.profile;
	const userName = profile?.username?.split('@')[0];

	const publicUrl = new URL(env.PUBLIC_URL);

	let customDomain = $state(profile?.custom_domain || '');
	let domainValid = $state(false);
	let domainStatus = $state('Domain not set');
	let domainStatusColor = $state('hsla(0, 100%, 0%, 0.5)');
	let domainReCheck = $state(0);

	setInterval(() => {
		domainReCheck = domainReCheck + 1;
	}, 2000);

	const checkDomain = _.throttle(async () => {
		if (customDomain != '') {
			if (customDomain.endsWith(env.PUBLIC_DOMAIN)) {
				domainStatus = 'Cannot use instance domain';
				domainValid = false;
				domainStatusColor = 'red';
				return;
			}

			let resp;
			try {
				resp = await fetch(
					`/__internal__/dns-check/${data.userId}/${customDomain}/${data.dnsChallenge}`
				);
			} catch (_) {}
			if (resp?.status == 200) {
				domainStatus = 'Domain validated';
				domainValid = true;
				domainStatusColor = 'green';
			} else {
				domainStatus =
					'Domain check unsuccessful. If you already set the DNS correctly you may just need to wait for it to propagate.';
				domainValid = false;
				domainStatusColor = 'red';
			}
		} else {
			domainStatus = '';
			domainValid = true;
		}
	}, 2000);

	$effect(() => {
		(async () => {
			domainReCheck;
			await checkDomain();
		})();
	});

	const siteUrl = profile?.custom_domain
		? `${publicUrl.protocol}//${profile.custom_domain}`
		: `${publicUrl.protocol}//${userName}.${env.PUBLIC_USER_DOMAIN_PARENT}`;
</script>

<svelte:head>
	<title>Profile | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="mx-4 flex w-full flex-col items-center">
	<div class="card m-4 mt-12 flex w-full max-w-[700px] flex-col gap-4 p-8 text-xl">
		<h1 class="my-3 text-3xl font-bold">Domain Management</h1>

		{#if data.profile?.username}
			<div class="ml-4 flex items-center gap-2">
				<strong>Your Site:</strong> <a href={siteUrl} class="text-base underline">{siteUrl}</a>
			</div>

			<h2 class="mt-4 text-xl font-bold">Custom Domain</h2>

			<div class="prose flex flex-col gap-2 text-base dark:prose-invert">
				<p>
					By default your generated website is hosted as a sub-domain of Weird.one,
					<code>{userName}.weird.one</code> but you can also use your own custom domain.
				</p>
				<p>
					Before setting your custom domain below, you must configure your DNS provider. This is
					different between different providers and domains.
				</p>
				<ul class="text-sm">
					<li>
						<strong>If your domain has more than one dot in it:</strong> you need to add
						a `CNAME` record for your domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it and your provider supports `ALIAS`
							or `ANAME` records:</strong
						> you need to add an `ALIAS` or `ANAME` record for that domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it and your provider supports "CNAME
							flattening":</strong
						> you need to add an `CNAME` record for that domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it, and your provider does not support
							CNAME flattening, and does not have the option for `ALIAS` or `ANAME` records":</strong
						> we do not currently support your DNS provider, but we will in the future.
					</li>
				</ul>

				<p>
					After you configure your DNS, you can enter your custom domain below. This page will check
					that the update has been applied properly and will let you save once it is complete.
				</p>

				<form method="post">
					<label>
						<span class="text-lg font-bold">Custom Domain</span>
						<input name="custom_domain" class="input" bind:value={customDomain} />
					</label>

					<div class="ml-4 mt-4 flex items-center gap-3">
						{#if customDomain != '' && !domainValid}
							<ProgressRadial width="w-8" />
						{/if}
						<div class="flex-grow" style="color: {domainStatusColor}">
							{domainStatus}
						</div>
						<button disabled={!domainValid} class="variant-ghost btn"> Save </button>
					</div>
				</form>
			</div>
		{:else}
			<p class="text-lg">You must set a username in the profile page to generate a website.</p>
		{/if}
	</div>
</main>

<style>
	code {
		background: hsla(0, 0%, 0%, 0.1);
		padding: 0.1em;
		border-radius: 2px;
	}
</style>
