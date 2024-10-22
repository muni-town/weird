<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { SvelteComponent } from 'svelte';
	import type { ActionData } from './$types';
	import _ from 'underscore';
	import { Page } from '../types';
	import InlineTextEditor from '$lib/components/editors/InlineTextEditor.svelte';
	import CompositeMarkdownEditor from '$lib/components/editors/CompositeMarkdownEditor.svelte';
	import LinksEditor from '$lib/components/editors/LinksEditor.svelte';
	import slugify from 'slugify';
	import { SlideToggle } from '@skeletonlabs/skeleton';

	const { form }: { form: ActionData } = $props();

	let page = $state(
		form?.data || {
			slug: '',
			display_name: 'Untitled',
			markdown: 'Your new page.',
			links: []
		}
	) as Page;
	const slugifiedSlug = $derived(
		slugify(page.slug || page.display_name || 'untitled', { strict: true, lower: true })
	);

	if (form && form.formData) {
		form.formData().then((formData) => {
			const result = Page.safeParse(formData);
			if (!('error' in result)) {
				page = result.data;
			}
		});
	}

	let displayNameEditorEl: SvelteComponent;

	const pageFormData = {
		get value() {
			return JSON.stringify(page);
		},
		set value(v) {
			page = JSON.parse(v);
		}
	};

	function handleSubmit(e: SubmitEvent) {
		page.slug = slugifiedSlug;
	}
</script>

<svelte:head>
	<title>New Page | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="mx-4 mt-4 flex w-full flex-col items-center">
	<div class="card m-4 mt-8 flex w-full max-w-[700px] flex-col gap-4 p-8 text-xl">
		<h1 class="relative my-3 text-center text-4xl">
			<div>
				<button
					class="variant-filled badge absolute right-[-4em] top-[-1em] z-10"
					onclick={() => displayNameEditorEl.focus()}>Click to Edit!</button
				>
				<InlineTextEditor bind:this={displayNameEditorEl} bind:content={page.display_name} />
			</div>
		</h1>

		<label class="flex flex-row items-center gap-2">
			<span class="basis-40">Page Slug</span>
			<div class="flex flex-grow flex-col">
				<input class="input" placeholder="slug" bind:value={page.slug} />
				<div class="ml-2 mt-1 text-sm">
					<pre class="inline">&nbsp;{slugifiedSlug}</pre>
				</div>
			</div>
		</label>
		<div class="flex justify-end text-sm">
			<SlideToggle name="wikiMode" size="sm" bind:checked={page.wiki} active="bg-tertiary-600"
				>Wiki Page: Everyone Can Edit</SlideToggle
			>
		</div>

		{#if form?.error}
			<aside class="alert variant-ghost-error w-full text-lg">
				<div class="alert-message">
					<p>Error creating new page: {form.error}</p>
				</div>
			</aside>
		{/if}

		<hr class="mb-3" />

		<div class="prose prose-invert max-w-full">
			<CompositeMarkdownEditor bind:content={page.markdown} />
		</div>

		<h2 class="text-2xl font-bold">Links</h2>

		<LinksEditor bind:links={page.links} />

		<form class="flex justify-end" method="post" onsubmit={handleSubmit}>
			<input type="hidden" name="data" bind:value={pageFormData.value} />
			<button class="variant-ghost-success btn">Create Page</button>
		</form>
	</div>
</main>
