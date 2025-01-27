<script lang="ts">
	import { page } from '$app/stores';
	import { formatEntityPath } from 'leaf-proto';
	import type { ActionData, PageData } from './$types';
	import type { KnownComponents } from '$lib/leaf';
	import { parseThemeData } from '$lib/renderer';

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
	let editingTagsState = $state('');
	let editingWebLinksState = $state('');
	let theme: { profile: string; page?: string } | undefined = $derived(
		knownComponents.weirdTheme && parseThemeData(knownComponents.weirdTheme.data)
	);

	$effect(() => {
		editingTagsState = data.components?.tags?.join(', ') || '';
	});
	$effect(() => {
		editingWebLinksState = JSON.stringify(data.components?.webLinks || [], null, '  ');
	});
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

	<table>
		<thead>
			<tr>
				<td>Namespace</td>
				<td>Note</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				{#each data.Namespaces as ns}
					<td><a href={`${$page.url}/${ns}`} class="font-mono">{ns}</a></td>
					{#if ns == 'x5lutctyz4otmhdkc2k7loxnljwzf4ronh6ymdb3p6yiqkhmfh4q'}
						<td>Weird Namespace</td>
					{/if}
				{/each}
			</tr>
		</tbody>
	</table>
{:else if data.Subspaces}
	<table>
		<thead>
			<tr>
				<td>Subspace</td>
				<td>Username</td>
				<td>RauthyId</td>
			</tr>
		</thead>
		<tbody>
			{#each data.Subspaces as ss}
				<tr>
					<td><a href={`${$page.url}/${ss.subspace}`} class="font-mono">{ss.subspace}</a></td>
					<td>{ss.username}</td>
					<td>{ss.rauthyId}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else if data.Entities}
	<table>
		<thead>
			<tr>
				<td>Entity Path</td>
				<td>Name</td>
			</tr>
		</thead>
		<tbody>
			{#each data.Entities as ent}
				<tr>
					<td>
						<a
							href={`${$page.url}/${encodeURIComponent(
								JSON.stringify(ent.path, (_key, value) =>
									typeof value === 'bigint' ? Number(value) : value
								)
							)}`}
							class="font-mono">{formatEntityPath(ent.path)}</a
						>
					</td>
					<td>{ent.name}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else if data.Entity}
	<h1>Entity</h1>
	{#if form?.error}
		<article class="pico-background-red-550">
			{form.error}
		</article>
	{/if}
	<form method="post" style="margin-bottom: 8em;" class="flex flex-col gap-3">
		<!-- <label>
			Username
			<input class="input" name="username" value={knownComponents.username} />
		</label> -->
		<label>
			Name
			<input class="input" name="name" value={knownComponents.name} />
		</label>
		<label>
			Description
			<textarea class="input" name="description" value={knownComponents.description}></textarea>
		</label>
		<label>
			Tags ( Comma Separated )
			<textarea class="input" name="tags" value={editingTagsState}></textarea>
		</label>
		<label>
			Web Links ( JSON )
			<textarea class="input" name="webLinks" value={editingWebLinksState}></textarea>
		</label>
		<label>
			Profile Theme
			<textarea class="input" name="profileTheme" value={theme?.profile}></textarea>
		</label>
		<label>
			Page Theme
			<textarea class="input" name="pageTheme" value={theme?.page}></textarea>
		</label>
		<label>
			Custom Domain
			<input class="input" name="customDomain" value={knownComponents.weirdCustomDomain} />
		</label>
		<label>
			CommonMark
			<textarea class="input" name="commonMark" value={knownComponents.commonmark}></textarea>
		</label>
		<label>
			Weird Wiki Page
			<input
				class="input"
				type="checkbox"
				name="weirdWikiPage"
				checked={knownComponents.weirdWikiPage != undefined}
			/>
		</label>
		<label>
			Weird Wiki Revision Author
			<input
				class="input"
				name="weirdWikiRevisionAuthor"
				value={knownComponents.weirdWikiRevisionAuthor}
			/>
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
