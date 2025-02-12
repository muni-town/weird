<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { SvelteComponent } from 'svelte';
	import type { ActionData } from './$types';
	import _ from 'underscore';
	import InlineTextEditor from '$lib/components/editors/InlineTextEditor.svelte';
	import CompositeMarkdownEditor from '$lib/components/editors/CompositeMarkdownEditor.svelte';
	import slugify from 'slugify';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { Page, PageSaveReq } from '$lib/pages/types';
	import { LoroDoc } from 'loro-crdt';
	import base64 from 'base64-js';

	const { form }: { form: ActionData } = $props();

	let page = $state(
		form?.data || {
			slug: '',
			name: 'Untitled',
			markdown: 'Your new page.'
		}
	) as Page;
	const slugifiedSlug = $derived(
		slugify(page.slug || page.name || 'untitled', { strict: true, lower: true })
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

	let formDataInput: HTMLInputElement;
	function handleSubmit(_e: SubmitEvent) {
		const doc = new LoroDoc();
		doc.setRecordTimestamp(true);
		const content = doc.getText('content');
		content.delete(0, 10e30);
		content.insert(0, page.markdown);
		const data: PageSaveReq = {
			name: page.name,
			slug: slugifiedSlug,
			wiki: false,
			loroSnapshot: base64.fromByteArray(doc.export({ mode: 'snapshot' }))
		};
		formDataInput.value = JSON.stringify(data);
	}

	$effect(() => {
		page.slug = slugify(page.name || 'untitled', { strict: true, lower: true });
	});
</script>

<svelte:head>
	<title>New Page | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex h-full w-full flex-col items-start font-spacemono">
	<div
		class="card relative mb-4 flex min-h-fit w-full max-w-[1000px] flex-col justify-start gap-4 rounded-xl p-8 text-xl sm:min-h-full"
	>
		<h1 class="relative my-3 text-center text-4xl">
			<div>
				<InlineTextEditor bind:this={displayNameEditorEl} bind:content={page.name} />
			</div>
		</h1>

		<label class="flex flex-row items-center gap-2">
			<span class="basis-40">Page Slug</span>
			<div class="flex flex-grow flex-col">
				<input class="border-none bg-transparent" placeholder="slug" bind:value={page.slug} />
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

		<form class="flex justify-end" method="post" onsubmit={handleSubmit}>
			<input type="hidden" name="data" bind:this={formDataInput} />
			<button class="variant-ghost-success btn">Create Page</button>
		</form>
	</div>
</main>
