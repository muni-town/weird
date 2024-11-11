<script lang="ts">
	// TODO: Investigate deduplicating code between this and the profile page editor.

	import { env } from '$env/dynamic/public';
	import type { PageData } from './$types';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';
	import { page } from '$app/stores';
	import { dateFromUnixTimestamp } from '$lib/utils/time';
	import { PUBLIC_USER_DOMAIN_PARENT } from '$env/static/public';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>
		{data.page.display_name} | {data.profile.display_name} |
		{env.PUBLIC_INSTANCE_NAME}
	</title>
</svelte:head>

<main class="mx-4 flex w-full flex-col items-center">
	<h1 class="mb-2 mt-4 text-4xl font-bold">Revision Of</h1>

	<h2 class="mb-2 font-mono">
		<a class="underline underline-offset-4" href={`/${$page.params.username}/${$page.params.slug}`}
			>{$page.params.username} / {$page.params.slug}</a
		>
	</h2>

	{new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(dateFromUnixTimestamp(BigInt($page.params.revision)))}

	<div>
		by <a class="underline" href={`/${data.revisionAuthor}`}
			>{data.revisionAuthor.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0]}</a
		>
	</div>

	<div
		class="card relative m-4 mt-12 flex w-full max-w-[700px] flex-col justify-center gap-4 p-8 text-xl"
	>
		<h1 class="relative mt-2 max-w-72 self-center text-center text-4xl">
			{data.page.display_name}
		</h1>

		<hr />

		<div class="flex flex-col gap-8">
			<div class="prose relative mx-auto w-full max-w-2xl px-4 pt-4 dark:prose-invert">
				{@html renderMarkdownSanitized(data.page.markdown)}
			</div>
			{#if data.page.links.length > 0}
				<hr />
				<div>
					<h2 class="mb-3 text-center text-2xl font-bold">Links</h2>
					<ul class="flex flex-col gap-2">
						{#each data.page.links as link}
							<li>
								<a class="variant-ghost btn" href={link.url}>
									{link.label || link.url}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</main>
