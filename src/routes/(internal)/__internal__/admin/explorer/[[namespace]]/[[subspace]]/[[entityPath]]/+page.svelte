<script lang="ts">
	import { page } from '$app/stores';
	import { formatEntityPath } from 'leaf-proto';
	import type { ActionData, PageData } from './$types';
	import type { KnownComponents } from '$lib/leaf';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	const base = `/__internal__/admin/explorer`;
	let segments = $derived(
		$page.url.pathname
			.replace(/^\/__internal__\/admin\/explorer/, '')
			.split('/')
			.filter((x) => !!x)
	);
	let breadcrumbs = $derived.by(() => {
		const l: { link: string; label: string }[] = [];
		for (let i = 0; i < segments.length; i++) {
			const seg = segments[i];
			function decodeSeg(str: string): string | undefined {
				try {
					const decode = decodeURIComponent(str);
					const json = JSON.parse(decode);
					return formatEntityPath(json);
				} catch (e) {
					return undefined;
				}
			}
			const decoded = decodeSeg(seg);
			if (i == segments.length - 1 && !!data.Entity && decoded) {
				l.push({ label: decoded, link: $page.url.href });
			} else {
				l.push({ label: seg, link: `${base}/${segments.slice(0, i + 1).join('/')}` });
			}
		}
		return l;
	});

	let knownComponents: KnownComponents = $derived(data.components || {});
	let editingTagsState = $state(data.components?.tags?.join(', ') || '');
	let editingWebLinksState = $state(JSON.stringify(data.components?.webLinks || [], null, '  '));
</script>

<article>
	<div class="breadcrumb">
		<a href={base}>Explorer</a>
		{#each breadcrumbs as b}
			→ <a href={b.link}>{b.label}</a>
		{/each}
	</div>
</article>

{#if data.Namespaces}
	<h2>Data Explorer</h2>

	<p>
		This is an administrative data explorer for the Weird server. It will list some of the raw data
		stored in the database and can be used to do things like edit or delete entities. This is meant
		as a low level tool to allow manipulation of data when something is broken and it is not
		possible to fix from the normal app, or when an admin needs to be able to edit the data of other
		users.
	</p>

	<p>
		If you need to get an overview of all the server data at the same time you can view the database
		<a href="/__internal__/admin/database-dump/view">debug dump page</a>.
	</p>

	Namespaces:
	<ul>
		{#each data.Namespaces as ns}
			<li><a href={`${$page.url}/${ns}`} class="font-mono">{ns}</a></li>
		{/each}
	</ul>
{:else if data.Subspaces}
	Subspaces:
	<ul>
		{#each data.Subspaces as ss}
			<li><a href={`${$page.url}/${ss}`} class="font-mono">{ss}</a></li>
		{/each}
	</ul>
{:else if data.Entities}
	Entities:
	<ul>
		{#each data.Entities as link}
			<li>
				<a href={`${$page.url}/${encodeURIComponent(JSON.stringify(link))}`} class="font-mono"
					>{formatEntityPath(link)}</a
				>
			</li>
		{/each}
	</ul>
{:else if data.Entity}
	<h1>Entity</h1>
	{#if form?.error}
		<article class="pico-background-red-550">
			{form.error}
		</article>
	{/if}
	<form method="post" style="margin-bottom: 8em;">
		<label>
			Username
			<input class="input" name="username" bind:value={knownComponents.username} />
		</label>
		<label>
			Name
			<input class="input" name="name" bind:value={knownComponents.name} />
		</label>
		<label>
			Description
			<textarea class="input" name="description" bind:value={knownComponents.description}
			></textarea>
		</label>
		<label>
			Tags ( Comma Separated )
			<textarea class="input" name="tags" bind:value={editingTagsState}></textarea>
		</label>
		<label>
			Web Links ( JSON )
			<textarea class="input" name="webLinks" bind:value={editingWebLinksState}></textarea>
		</label>
		<label>
			Pubpage Theme
			<input class="input" name="pubpageTheme" bind:value={knownComponents.weirdPubpageTheme} />
		</label>
		<label>
			Custom Domain
			<input class="input" name="customDomain" bind:value={knownComponents.weirdCustomDomain} />
		</label>
		<label>
			CommonMark
			<textarea class="input" name="commonMark" bind:value={knownComponents.commonmark}></textarea>
		</label>

		<button formaction="?/save">Update</button>
		<button formaction="?/delete">Delete</button>
	</form>
{/if}

<style>
	.breadcrumb {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
	}
</style>
