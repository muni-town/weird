<script lang="ts">
	import { createThemeData, renderPage, renderProfile as renderProfile } from '$lib/renderer/index';
	import TemplateEditor from '$lib/components/editors/TemplateEditor.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import minimalProfileTheme from './minimalProfileTheme.html.j2?raw';
	import minimalPageTheme from './minimalPageTheme.html.j2?raw';
	import weirdProfileTheme from '$lib/themes/weird/profile.html.j2?raw';
	import examplePageMarkdown from './examplePage.md?raw';
	import weirdPageTheme from '$lib/themes/weird/page.html.j2?raw';
	import { onMount } from 'svelte';
	import { Tab, TabGroup } from '@skeletonlabs/skeleton';

	let { data }: { data: PageData } = $props();

	const encoder = new TextEncoder();

	let profileTemplate = $state(weirdProfileTheme);
	let pageTemplate = $state(weirdPageTheme);
	let tab = $state(0);

	let renderMount: HTMLIFrameElement | undefined = $state(undefined);

	onMount(() => {
		if (data.theme) {
			profileTemplate = data.theme.profile;
			if (data.theme.page) pageTemplate = data.theme.page;
		}
	});

	$effect(() => {
		let rendered =
			tab == 0
				? renderProfile(
						{ handle: $page.params.username, ...data.profile, pages: data.pages },
						createThemeData(profileTemplate, pageTemplate)
					)
				: renderPage(
						{ handle: $page.params.username, ...data.profile, pages: data.pages },
						{
							title: 'Example Page',
							slug: 'example',
							markdown: examplePageMarkdown
						},
						createThemeData(profileTemplate, pageTemplate)
					);
		rendered.then((rendered) => {
			if (!renderMount) return;
			renderMount.contentWindow?.document.open();
			renderMount.contentWindow?.document.write(rendered);
			renderMount.contentWindow?.document.close();
		});
	});

	function loadMinimalTheme() {
		profileTemplate = minimalProfileTheme;
		pageTemplate = minimalPageTheme;
	}

	function resetToDefault() {
		profileTemplate = weirdProfileTheme;
		pageTemplate = weirdPageTheme;
	}

	async function setUserTheme(templates?: { profile: string; page: string }) {
		await fetch(`/${$page.params.username}/settings/setTheme`, {
			method: 'post',
			body: JSON.stringify({
				templates
			}),
			headers: [['content-type', 'application/json']]
		});

		window.location.reload();
	}

	async function save() {
		await setUserTheme(
			profileTemplate === weirdProfileTheme && pageTemplate === weirdPageTheme
				? undefined
				: { profile: profileTemplate, page: pageTemplate }
		);
	}
</script>

<main class="flex w-full flex-col">
	<div class="mx-8 flex flex-row items-center justify-between gap-3 pt-4">
		<div class="flex gap-3">
			<button class="btn" class:variant-outline={tab == 0} onclick={() => (tab = 0)}>
				Profile Template
			</button>
			<button class="btn" class:variant-outline={tab == 1} onclick={() => (tab = 1)}>
				Page Template
			</button>
		</div>

		<span class="flex-grow"></span>

		<h1 class="text-center text-2xl font-bold">Experimental Theme Editor</h1>
		<span class="flex-grow"></span>
		<span class="flex gap-2">
			<button class="variant-ghost btn" onclick={save}>Save</button>
			<button class="variant-ghost btn" onclick={resetToDefault}>Reset to Default</button>
			<button class="variant-ghost btn" onclick={loadMinimalTheme}
				>Load Minimal Example Theme</button
			>
		</span>
	</div>

	<TabGroup class="mt-3">
		<!-- Tab Panels --->
		<svelte:fragment slot="panel">
			{#if tab === 0}
				<div class="flex h-[80vh] w-full flex-grow flex-row items-stretch justify-stretch">
					<div class="h-full w-full pr-2 pt-2">
						<h2 class="mb-2 text-center text-xl font-bold">Profile Template</h2>
						<div class="max-h-full overflow-y-scroll">
							<TemplateEditor bind:content={profileTemplate} class="max-h-full" />
						</div>
					</div>
					<div class="h-full w-full px-2 pt-8">
						<iframe
							title="Page Preview"
							bind:this={renderMount}
							height="100%"
							width="100%"
							style="border: 3px solid white; border-radius: 1em;"
							class="bg-white shadow-md"
						></iframe>
					</div>
				</div>
			{:else if tab === 1}
				<div class="flex h-[80vh] w-full flex-grow flex-row items-stretch justify-stretch">
					<div class="h-full w-full pr-2 pt-2">
						<h2 class="mb-2 text-center text-xl font-bold">Page Template</h2>
						<div class="max-h-full overflow-y-scroll">
							<TemplateEditor bind:content={pageTemplate} class="max-h-full" />
						</div>
					</div>
					<div class="h-full w-full px-2 pt-8">
						<iframe
							title="Page Preview"
							bind:this={renderMount}
							height="100%"
							width="100%"
							style="border: 3px solid white; border-radius: 1em;"
							class="bg-white shadow-md"
						></iframe>
					</div>
				</div>
			{/if}
		</svelte:fragment>
	</TabGroup>
</main>
