<script lang="ts">
	import { renderProfile as renderProfile } from '$lib/renderer/index';
	import TemplateEditor from '$lib/components/editors/TemplateEditor.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import minimalTheme from './minimalTheme.html.j2?raw';
	import weirdTheme from '$lib/themes/weird/profile.html.j2?raw';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	const encoder = new TextEncoder();

	let template = $state(weirdTheme);

	let renderMount: HTMLIFrameElement;

	onMount(() => {
		if (data.theme) {
			template = new TextDecoder().decode(data.theme.data);
		}
	});

	$effect(() => {
		renderProfile(
			{ handle: $page.params.username, ...data.profile, pages: data.pages },
			encoder.encode(template)
		).then((rendered) => {
			renderMount.contentWindow?.document.open();
			renderMount.contentWindow?.document.write(rendered);
			renderMount.contentWindow?.document.close();
		});
	});

	function loadMinimalTheme() {
		template = minimalTheme;
	}

	function resetToDefault() {
		template = weirdTheme;
	}

	async function setUserTheme(template?: string) {
		await fetch(`/${$page.params.username}/settings/setTheme`, {
			method: 'post',
			body: JSON.stringify({
				template
			}),
			headers: [['content-type', 'application/json']]
		});

		window.location.reload();
	}

	async function save() {
		await setUserTheme(template === weirdTheme ? undefined : template);
	}
</script>

<main class="flex w-full flex-col">
	<div class="mx-8 flex flex-row items-center justify-between gap-3 pt-4">
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
	<div class="flex h-[80vh] w-full flex-grow flex-row items-stretch justify-stretch">
		<div class="h-full w-full pr-2 pt-2">
			<h2 class="mb-2 text-center text-xl font-bold">HTML Template</h2>
			<div class="max-h-full overflow-y-scroll">
				<TemplateEditor bind:content={template} class="max-h-full" />
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
</main>
