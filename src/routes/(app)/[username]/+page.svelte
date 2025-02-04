<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import { onNavigate } from '$app/navigation';
	import InlineTextEditor from '$lib/components/editors/InlineTextEditor.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';
	import type { ActionData, PageData } from './$types';
	import CompositeMarkdownEditor from '$lib/components/editors/CompositeMarkdownEditor.svelte';
	import LinksEditor from '$lib/components/editors/LinksEditor.svelte';
	import Icon from '@iconify/svelte';
	import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import { page } from '$app/stores';
	import SocialMediaButton from '$lib/components/social-media/social-media-button.svelte';
	import FeaturedSocialMediaButton from '$lib/components/social-media/featured-social-media-button.svelte';
	import PostCard from './post-card.svelte';
	import { usernames } from '$lib/usernames/client';
	import SocialLinksEditor from '$lib/components/editors/SocialLinksEditor.svelte';
	// TODO: Replace PicoCSS in Weird app styling
	//
	// This brings into scope some CSS variables from PicoCSS that we use in Weird.
	//
	// We want to replace this once we have a more unified styling system in Weird.
	//
	// We should probably look into https://open-props.style/ as a part of this.
	import '$lib/themes/weird.svelte';
	import PagesListEditor from '$lib/components/editors/PagesListEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editingState: { editing: boolean; profile: Profile } = $state({
		editing: false,
		profile: { tags: [], links: [], social_links: [], bio: '', display_name: '' }
	});

	// Prepare editing state, if this is the logged in user's profile page.
	if (data.profileMatchesUserSession) {
		editingState.profile = data.profile;
	}

	let profile = $derived(data.profile as Profile);
	let pubpageHost = $derived(data.username);
	let pubpageUrl = $derived(`${new URL(env.PUBLIC_URL).protocol}//${pubpageHost}`);

	let editingTagsState = $state('');
	let editingTagsProxy = $state({
		get value() {
			return editingTagsState;
		},
		set value(value: string) {
			editingTagsState = value;
			editingState.profile.tags = value
				.split(',')
				.map((x) => x.trim())
				.filter((x) => !!x);
		}
	});

	const editingLinksProxy = {
		get value() {
			return JSON.stringify(editingState.profile.links);
		}
	};
	const editingSocialLinksProxy = {
		get value() {
			return JSON.stringify(editingState.profile.social_links);
		}
	};

	let avatarSrcOverride = $state(undefined) as string | undefined;

	function handleAvatarChange(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		var reader = new FileReader();
		reader.onload = function () {
			// Preview Image
			avatarSrcOverride = reader.result as string;
		};
		// Read Selected Image as DataURL
		reader.readAsDataURL(e.currentTarget!.files![0]);
	}

	function startEdit() {
		if (data.profileMatchesUserSession) {
			editingState.profile = data.profile;
			if (!editingState.profile.bio) editingState.profile.bio = '';
			if (!editingState.profile.bio)
				editingState.profile.display_name =
					data.profile.display_name || usernames.shortNameOrDomain(data.username);

			editingState.editing = true;
			editingTagsState = data.profile.tags.join(', ');
		}
	}

	function cancelEdit(e?: Event) {
		if (e) e.preventDefault();
		editingState.editing = false;
		editingState.profile = data.profile;
		avatarSrcOverride = undefined;
	}

	onNavigate(() => cancelEdit());

	const [fadeOut, fadeIn] = crossfade({
		duration: 500,
		easing: quintOut
	});

	// svelte-ignore non_reactive_update
	let displayNameEditorEl: SvelteComponent;
	// svelte-ignore non_reactive_update
	let avatarInputEl: HTMLInputElement;
</script>

<svelte:head>
	<title>
		{profile.display_name || data.username} |
		{env.PUBLIC_INSTANCE_NAME}
	</title>
</svelte:head>

<main class="mx-4 flex w-full max-w-full flex-col items-center px-2 font-spacemono">
	<div
		class="m-4 mt-12 flex w-full max-w-[700px] flex-col gap-4 rounded-xl card p-8 text-xl"
	>
		<div class="relative flex items-center gap-4">
			{#if !editingState.editing}
				<Avatar src={`/${data.username}/avatar`} class="min-w-[40px]" />
			{:else}
				<figure class="relative">
					<Avatar src={avatarSrcOverride || `/${data.username}/avatar`} />
					<figcaption
						class="absolute left-0 top-0 h-full w-full rounded-full bg-black/75 bg-opacity-50 opacity-0 hover:opacity-100"
					>
						<button
							title="Change avatar"
							class="h-full w-full"
							onclick={() => avatarInputEl.click()}
						>
							<Icon icon="ph:camera-light" font-size="3.5em" class="m-auto" />
						</button>
					</figcaption>
				</figure>
			{/if}
			<div class="flex flex-shrink flex-col overflow-hidden">
				<h1 class="relative grid overflow-hidden text-ellipsis font-rubik text-4xl">
					{#if !editingState.editing}
						<div style="grid-area: 1 / 1;">
							{profile.display_name || usernames.shortNameOrDomain(data.username)}
						</div>
					{:else}
						<div style="grid-area: 1 / 1;">
							<InlineTextEditor
								bind:this={displayNameEditorEl}
								bind:content={editingState.profile.display_name as string}
							/>
						</div>
					{/if}
				</h1>
				<a
					href={pubpageUrl}
					rel="me canonical"
					class="overflow-hidden text-ellipsis text-sm text-surface-100 underline decoration-1 underline-offset-4"
				>
					{pubpageHost}
				</a>
				<div class="mt-4 flex flex-wrap items-center gap-4">
					{#each editingState.editing ? editingState.profile.social_links : profile.social_links as link}
						<FeaturedSocialMediaButton
							url={link.url}
							verified={data.verifiedLinks.includes(link.url)}
						/>
					{/each}
				</div>
				{#if form?.error}
					<aside class="alert variant-ghost-error my-2 w-full">
						<div class="alert-message">
							<p>Error updating profile: {form.error}</p>
						</div>
					</aside>
				{/if}
			</div>

			<div class="absolute right-0 top-0 flex gap-2">
				{#if data.profileMatchesUserSession}
					{#if !editingState.editing}
						<button
							class="variant-ghost btn-icon absolute right-0 top-0"
							in:fadeIn={{ key: 'edit-buttons' }}
							out:fadeOut={{ key: 'edit-buttons' }}
							title="Edit"
							onclick={startEdit}
						>
							<Icon icon="raphael:edit" />
						</button>
					{:else}
						<form
							method="post"
							class="absolute right-0 top-0 flex flex-col gap-4"
							in:fadeIn={{ key: 'edit-buttons' }}
							out:fadeOut={{ key: 'edit-buttons' }}
							enctype="multipart/form-data"
							action="?/edit"
						>
							<input type="hidden" name="display_name" value={editingState.profile.display_name} />
							<input
								name="avatar"
								type="file"
								class="hidden"
								accept=".jpg, .jpeg, .png, .webp, .gif"
								bind:this={avatarInputEl}
								onchange={handleAvatarChange}
							/>
							<input type="hidden" name="bio" value={editingState.profile.bio} />
							<input type="hidden" name="tags" value={editingState.profile.tags} />
							<input type="hidden" name="links" value={editingLinksProxy.value} />
							<input type="hidden" name="social_links" value={editingSocialLinksProxy.value} />

							<div class="flex flex-row gap-2">
								<button class="variant-ghost-success btn-icon" title="Save">
									<Icon icon="raphael:check" />
								</button>
								<button class="variant-ghost-error btn-icon" title="Cancel" onclick={cancelEdit}>
									<Icon icon="proicons:cancel" />
								</button>
							</div>
						</form>
					{/if}
				{/if}
			</div>
		</div>

		<hr />

		{#if editingState.editing}
			<h3 class="ml-3 text-center">Social Links</h3>
			<div class="flex flex-col gap-2 px-5">
				<SocialLinksEditor bind:links={editingState.profile.social_links} />
			</div>
		{/if}

		<div class="mt-4 flex flex-col gap-8">
			<div class="prose relative mx-auto w-full max-w-2xl px-4 pt-4 dark:prose-invert">
				{#if !editingState.editing}
					{@html renderMarkdownSanitized(profile.bio || '')}
				{:else}
					<CompositeMarkdownEditor
						maxLength={512}
						bind:content={editingState.profile.bio as string}
					/>
				{/if}
			</div>
			{#if profile.links.length > 0 || editingState.editing}
				<div>
					<h2 class="mb-4 text-center font-rubik text-2xl font-bold">Links</h2>
					{#if !editingState.editing}
						<ul class="flex flex-col items-center gap-4">
							{#each profile.links as link (link.url)}
								<SocialMediaButton
									url={link.url}
									label={link.label}
									verified={data.verifiedLinks.includes(link.url)}
									rel="me"
								/>
							{/each}
						</ul>
					{:else}
						<LinksEditor bind:links={editingState.profile.links} />
					{/if}
				</div>
			{/if}
			{#if data.pages.length > 0}
				{#if editingState.editing}
					<PagesListEditor pages={data.pages} />
				{:else}
					<div>
						<h2 class="mb-4 text-center font-rubik text-2xl font-bold">Pages</h2>
						<ul class="mt-6 flex flex-col items-center gap-10">
							{#each data.pages as p}
								<li>
									<a class="link" href={`/${$page.params.username}/${p.slug}`}>
										{p.name || p.slug}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
			{#if profile.tags.length > 0 || editingState.editing}
				<div class="mt-4 flex flex-wrap items-baseline gap-2">
					<h1 class="font-rubik">Tags</h1>
					{#if editingState.editing}
						<span class="text-sm"> Separate multiple tags with commas.</span>
						<div class="basis-full">
							<input class="input" bind:value={editingTagsProxy.value} />
						</div>
					{/if}
					<span class="flex flex-wrap gap-2 text-base">
						{#each editingState.editing ? editingState.profile.tags : profile.tags as tag}
							<a
								href={`/people?q=${tag}`}
								class="rounded-full border-2 border-black bg-[#a092e3] px-4 py-2 text-black"
							>
								{tag}
							</a>
						{/each}
					</span>
				</div>
			{/if}

			<div>
				{#if editingState.editing && env.PUBLIC_ENABLE_EXPERIMENTS == 'true'}
					<form method="POST" action="?/rss">
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-none">
							<div class="input-group-shim">
								<Icon icon="mdi:rss" class="h-6 w-6" />
							</div>
							<input type="url" placeholder="Enter RSS Link" name="rssLink" />

							<button type="submit" class="variant-filled-secondary text-base">Import</button>
						</div>
						<span class="text-sm text-error-300">{form?.rss?.error}</span>
					</form>
				{/if}

				{#if form?.rss?.items}<div class="mt-8 grid grid-cols-1 gap-4">
						{#each form.rss.items ?? [] as post}
							<PostCard {post} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<style>
	.link {
		color: black;
		font-family: 'Rubik Mono One';
		background-color: #a092e3;
		padding: var(--size-fluid-1) var(--size-fluid-2);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-2);
		box-shadow: 0.35rem 0.45rem black;
		text-decoration: none;
		text-align: center;
	}
</style>
