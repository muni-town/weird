<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import type { ActionData, PageData } from './$types';
	import _ from 'underscore';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const { data, form }: { data: PageData; form: ActionData } = $props();
	const profile = data.profile;

	const publicUrl = new URL(env.PUBLIC_URL);

	let customDomain = $state(profile?.custom_domain || '');
	let domainValid = $state(false);
	let domainStatus = $state('Domain not set');
	let domainStatusColor = $state('hsla(0, 100%, 0%, 0.5)');
	let domainReCheck = $state(0);
	let newDomain: string | undefined = $state();

	if (browser) {
		setInterval(() => {
			domainReCheck = domainReCheck + 1;
		}, 2000);
	}

	onMount(() => {
		newDomain = new URL(window.location.href).searchParams.get('newDomain') || undefined;
		if (newDomain) {
			customDomain = newDomain;
		}
	});

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

	$effect(() => {
		if (newDomain && customDomain && domainValid && !form?.error) {
			domainForm.submit();
		}
	});

	const siteUrl = profile?.custom_domain
		? `${publicUrl.protocol}//${profile.custom_domain}`
		: `${publicUrl.protocol}//${userName}.${env.PUBLIC_USER_DOMAIN_PARENT}`;

	let domainForm: HTMLFormElement;
</script>

<svelte:head>
	<title>Profile | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="mx-4 flex w-full flex-col items-center">
	<div class="card m-4 mt-12 flex w-full max-w-[700px] flex-col gap-4 p-8 text-xl">
		{#if !newDomain}
			<h1 class="my-3 text-3xl font-bold">Domain Management</h1>

			<div class="ml-4 flex items-center gap-2">
				<strong>Your Site:</strong> <a href={siteUrl} class="text-base underline">{siteUrl}</a>
			</div>

			<h2 class="mt-4 text-xl font-bold">Automatic Setup</h2>

			<div class="prose prose-invert">
				<p>
					Through our partnership with <a href="https://takingnames.io">TakingNames.io</a>, you can
					purchase your very own domain, and we'll connect it automatically to your Weird site!
				</p>
			</div>

			<a class="variant-ghost btn" href={`/${$page.params.username}/settings/domain/takingnames`}
				>Connect TakingNames.io Domain</a
			>

			<h2 class="mt-4 text-xl font-bold">Manual Setup</h2>

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
						<strong>If your domain has more than one dot in it:</strong> you need to add a `CNAME`
						record for your domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it and your provider supports `ALIAS` or `ANAME`
							records:</strong
						>
						you need to add an `ALIAS` or `ANAME` record for that domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it and your provider supports "CNAME flattening":</strong
						>
						you need to add an `CNAME` record for that domain that points to `{env.PUBLIC_DOMAIN}`.
					</li>
					<li>
						<strong
							>If your domain only has one dot in it, and your provider does not support CNAME
							flattening, and does not have the option for `ALIAS` or `ANAME` records":</strong
						> we do not currently support your DNS provider, but we will in the future.
					</li>
				</ul>

				<p>
					After you configure your DNS, you can enter your custom domain below. This page will check
					that the update has been applied properly and will let you save once it is complete.
				</p>
			</div>
		{:else}
			<h1 class="my-3 text-3xl font-bold">Finish Automatic Domain Setup</h1>
			<p class="prose prose-invert">
				Your domain has been configured! Leave this tab open and as soon as the changes have been
				propagated your site will be updated.
			</p>
		{/if}

		<form bind:this={domainForm} method="post">
			{#if form?.error}
				<aside class="alert variant-ghost-error my-2 w-full">
					<div class="alert-message">
						<p>{form.error}</p>
					</div>
				</aside>
			{/if}
			<label>
				<span class="text-lg font-bold">Custom Domain</span>
				<input
					name="custom_domain"
					class="input"
					disabled={!!newDomain}
					bind:value={customDomain}
				/>
			</label>

			<div class="ml-4 mt-4 flex items-center gap-3">
				{#if customDomain != '' && !domainValid}
					<ProgressRadial width="w-8" />
					<div class="flex-grow">
						{#if newDomain}Checking domain...{/if}
					</div>
				{/if}
				{#if !newDomain}
					<div class="flex-grow" style="color: {domainStatusColor}">
						{domainStatus}
					</div>
					<button disabled={!domainValid} class="variant-ghost btn"> Save </button>
				{/if}
			</div>
		</form>
	</div>
</main>

<style>
	code {
		background: hsla(0, 0%, 0%, 0.1);
		padding: 0.1em;
		border-radius: 2px;
	}
</style>
