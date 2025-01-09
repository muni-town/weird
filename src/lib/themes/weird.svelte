<script lang="ts">
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import AvatarEditor from '$lib/components/avatar/editor.svelte';
	import EditLinks from '$lib/components/pubpage-admin/edit-links.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { usernames } from '$lib/usernames/client';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';
	import type { Snippet } from 'svelte';

	type Props = {
		avatar: string;
		profile: Profile;
		pages: { name?: string; slug: string }[];
		token: any;
		is_author: boolean;
		footer: Snippet;
		setAvatar: (new_avatar: string) => void;
		setUnsavedChanges: (value: boolean) => void;
	};

	let { avatar, profile, token, pages, is_author, setAvatar, setUnsavedChanges, footer }: Props =
		$props();

	let editingTags = $state(false);
	let linkLabel = $state('');
	let linkUrl = $state('');
	let avatarInput = $state<HTMLInputElement>();

	let initialLoaded = true;
	$effect(() => {
		if (profile && !initialLoaded) {
			setUnsavedChanges(true);
		}
		initialLoaded = false;
	});

	let editingAvatar = $state('');
	const ChangeAvatar = (e: any) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			editingAvatar = e.target!.result as string;
		};
		reader.readAsDataURL(file);
	};

	const editLinkCallback = (label: string, url: string) => {
		editingTags = false;
		setUnsavedChanges(true);
		profile.links = profile.links?.map((link) => {
			if (link.label === linkLabel && link.url === linkUrl) {
				link.url = url;
				link.label = label;
			}
			return link;
		});
		if (linkLabel === '' && linkUrl === '' && profile.links) {
			profile.links.push({ label, url });
		}
	};
	const addTags = () => {
		profile.tags = profile.tags || [];
		profile.tags.push('(newly added tag)');
	};
	const deleteTag = (tag: string) => {
		profile.tags = profile.tags.filter((t) => t !== tag);
	};
</script>

<svelte:head>
	<link rel="stylesheet" href="pico.min.css" />
</svelte:head>

<div class="stars"></div>

{#if profile}
	{#if editingAvatar != ''}
		<AvatarEditor
			img={editingAvatar}
			cancelCallback={() => (editingAvatar = '')}
			saveCallback={(new_avatar) => {
				avatar = new_avatar;
				editingAvatar = '';
				setAvatar(new_avatar);
			}}
		/>
	{/if}

	<main data-theme="dark">
		<section>
			<EditLinks
				label={linkLabel}
				url={linkUrl}
				open={editingTags}
				saveCallback={editLinkCallback}
			/>
			<input
				bind:this={avatarInput}
				type="file"
				onchange={ChangeAvatar}
				name="avatar"
				style="display: none;"
			/>
			{#if is_author}
				<figure class="avatar-figure">
					<img src={avatar} alt={`${profile.display_name} avatar`} />
					<figcaption class="avatar-figcaption">
						<label for="avatar">
							<button onclick={() => avatarInput?.focus()}>
								<!-- TODO: find png -->
								<img src="/edit-avatar.png" alt={'edit-avatar'} />
							</button>
						</label>
					</figcaption>
				</figure>
			{:else}
				<figure class="avatar-figure">
					<img src={avatar} alt={`${profile.display_name} avatar`} />
				</figure>
			{/if}
			{#if is_author}
				<h1
					contenteditable="true"
					bind:textContent={profile.display_name}
					style="margin-top: 1em;"
				></h1>
			{:else}
				<h1>{profile.display_name}</h1>
			{/if}

			{#if profile.bio}
				{#if is_author}
					<textarea
						style="max-width: 800px; text-align:justify;"
						bind:value={profile.bio}
						contenteditable="true"
					></textarea>
				{:else}
					{@html renderMarkdownSanitized(profile.bio)}
				{/if}
			{/if}

			{#if profile.tags && profile.tags.length > 0}
				<h1>Tags</h1>
				<div class="tags">
					{#each profile.tags as tag}
						{#if is_author}
							<span contenteditable="true" class="tag">
								{tag}
							</span>
							<span
								style="color: var(--pico-del-color); cursor: pointer; margin-right: 1rem;"
								onclick={() => deleteTag(tag)}>&times;</span
							>
						{:else}
							<a href={`${env.PUBLIC_URL}/people#${tag}`} target="_blank" class="tag">
								{tag}
							</a>
						{/if}
					{/each}
					{#if is_author}
						<span
							onclick={addTags}
							style="color: var(--pico-primary); cursor: pointer;"
							title="Add tag"
						>
							+
						</span>
					{/if}
				</div>
			{/if}
		</section>

		{#if profile.links}
			<section class="links">
				<h2>Links</h2>
				<a href={`${env.PUBLIC_URL}/${$page.url.host}`} class="link">Weird</a>
				{#each profile.links as link}
					{#if is_author}
						<a
							href={link.url}
							target="_blank"
							onclick={(e) => (
								e.preventDefault(),
								(editingTags = true),
								(linkLabel = link.label!),
								(linkUrl = link.url!)
							)}
							class="link"
						>
							{link.label}
						</a>blackblack
					{:else}
						<a href={link.url} target="_blank" class="link">
							{link.label || link.url}
						</a>
					{/if}
				{/each}
			</section>
		{/if}

		{#if pages?.length > 0}
			<section class="links">
				<h2>Pages</h2>
				{#each pages as link}
					<a
						href={`${env.PUBLIC_URL}/${usernames.shortNameOrDomain($page.params.username)}/${link.slug}`}
						target="_blank"
						class="link"
					>
						{link.name ||
							`${env.PUBLIC_URL}/${usernames.shortNameOrDomain($page.params.username)}/${link.slug}`}
					</a>
				{/each}
			</section>
		{/if}

		{@render footer()}
	</main>
{/if}

<style>
	@import 'https://unpkg.com/open-props';
	@import url('https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');

	@font-face {
		font-family: 'Uncut Sans';
		src: url('/UncutSans-Variable.woff2');
	}

	main {
		height: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: var(--size-fluid-4);
		font-weight: normal;
		font-family: 'Space Mono', monospace !important;
		background: linear-gradient(180deg, #240940 40%, #8e4569 80%, #be185d);
	}

	:global(body) {
		background: linear-gradient(180deg, #240940 20%, #8e4569 60%, #cb5873);
		background-repeat: no-repeat;
		background-size: cover;
		position: relative;
	}

	.stars {
		background: url('/stars.avif');
		pointer-events: none;
		/* extend a bit more than the viewport */
		height: 100%;
		width: 100%;
		background-position: center;
		background-size: 1500px;
		background-repeat: repeat;
		position: absolute;
		left: 0;
		top: 0;
		overflow: hidden;
		opacity: 0.25;
	}

	h1 {
		font-family: 'Rubik Mono One';
	}

	section {
		background-color: rgba(255, 255, 255, 0.1);
		padding: var(--size-fluid-5);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-3);
		width: 100%;
		margin: 0 auto;
		max-width: var(--size-content-3);
	}

	.avatar-figure img {
		width: 200px;
		margin-left: auto;
		margin-right: auto;
		border-radius: 100%;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		flex-direction: row;
		gap: 1.5rem;
	}

	.tag {
		color: black;
		background-color: #a092e3;
		padding: var(--size-fluid-1) var(--size-fluid-2);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-round);
		text-decoration: none;
	}

	.links {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;

		h2 {
			text-align: center;
		}
	}

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
