<script lang="ts">
	import type { Profile } from '../../routes/(app)/auth/v1/account/proxy+page.server';
	import { env } from '$env/dynamic/public';
	import AvatarEditor from '$lib/components/avatar/editor.svelte';
	import EditLinks from '$lib/components/pubpage-admin/edit-links.svelte';
	import { marked } from 'marked';

	let editingTags = false;
	let linkLabel = '';
	let linkUrl = '';

	export let avatar: string;
	export let fallbackAvatar;
	export let profile: Profile;
	export let token;
	export let is_author;
	export let setUnsavedChanges: (value: boolean) => void;
	export let setAvatar: (new_avatar: string) => void;

	type WorkCapacity = 'full_time' | 'part_time' | 'not_specified';
	type WorkCompensation = 'paid' | 'volunteer' | 'not_specified';
	const printWorkCapacity = (c?: WorkCapacity): string => {
		if (c == 'full_time') {
			return 'Full Time';
		} else if (c == 'part_time') {
			return 'Part Time';
		} else {
			return 'Not Specified';
		}
	};
	const printWorkCompensation = (c?: WorkCompensation): string => {
		if (c == 'paid') {
			return 'Paid';
		} else if (c == 'volunteer') {
			return 'Volunteer';
		} else {
			return 'Not Specified';
		}
	};

	let initialLoaded = true;
	$: {
		if (profile && !initialLoaded) {
			setUnsavedChanges(true);
		}
		initialLoaded = false;
	}

	let editingAvatar = '';
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
	<link rel="stylesheet" href="https://unpkg.com/pico.css/dist/pico.min.css" />
</svelte:head>

{#if profile}
	<EditLinks label={linkLabel} url={linkUrl} open={editingTags} saveCallback={editLinkCallback} />
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
	<div class="retro">
		{#if is_author}
			<input type="file" onchange={ChangeAvatar} name="avatar" style="display: none;" />
			<img
				src={avatar}
				width="200px"
				alt="Avatar"
				class="retro-avatar"
				onerror={(ev: Event) => {
					console.log('Image error!!!');
					(ev.target as HTMLImageElement).src = fallbackAvatar;
				}}
				onclick={() => document.querySelector('input[name="avatar"]')?.click()}
			/>
		{:else}
			<img
				src={avatar}
				width="200px"
				alt="Avatar"
				class="retro-avatar"
				onerror={(ev: Event) => {
					console.log('Image error!!!');
					(ev.target as HTMLImageElement).src = fallbackAvatar;
				}}
			/>
		{/if}
		{#if is_author}
			<h1 class="retro-name" bind:textContent={profile.display_name} contenteditable="true">
				{profile.display_name}
			</h1>
		{:else}
			<h1 class="retro-name">
				{profile.display_name}
			</h1>
		{/if}
		{#if profile.bio}
			{#if is_author}
				<blockquote bind:textContent={profile.bio} contenteditable="true">
					{profile.bio}
				</blockquote>
			{:else}
				<div class="prose dark:prose-invert">
					{@html marked.parse(profile.bio)}
				</div>
			{/if}
		{/if}

		<div>
			{#if is_author}
				<span contenteditable="true" bind:textContent={profile.location}></span>
			{:else}
				<span>{profile.location}</span>
			{/if}
		</div>
		<h1>
			Links {#if is_author}
				<span
					class="link"
					style="color: var(--pico-primary); cursor: pointer;"
					onclick={() => ((editingTags = true), (linkLabel = ''), (linkUrl = ''))}
					title="Add link"
				>
					+
				</span>
			{/if}
		</h1>
		<div class="retro-links">
			{#each profile.links as link}
				{#if is_author}
					<a
						href={link.url}
						class="retro-link"
						onclick={(e) => {
							e.preventDefault();
							linkLabel = link.label;
							linkUrl = link.url;
							editingTags = true;
						}}
					>
						<span class="retro-link-label">{link.label}</span>
						<span class="retro-link-url">{link.url}</span>
					</a>
				{:else}
					<a href={link.url} class="retro-link">
						<span class="retro-link-label">{link.label}</span>
						<span class="retro-link-url">{link.url}</span>
					</a>
				{/if}
			{/each}
		</div>
		<div class="retro-tags">
			{#each profile.tags as tag}
				{#if is_author}
					<span contenteditable="true" bind:textContent={tag} class="retro-tag">
						{tag}
					</span>
					<span
						style="color: var(--pico-del-color); cursor: pointer; margin-right: 1rem;"
						onclick={() => deleteTag(tag)}>&times;</span
					>
				{:else}
					<a href={`${env.PUBLIC_URL}/members?q=${tag}`} target="_blank" class="retro-tag">
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
	</div>
{/if}

<style>
	.retro {
		padding: 2rem 6rem;
		display: inline-block;
		background-color: var(--pico-background-color);
		--pico-background-color: #000;
		--pico-color: #d0dec5;
		--pico-h1-color: #ccfca7;
		--pico-span-color: #ccfca7;
		/* min-height: 100vh; */
	}
	@media (max-width: 800px) {
		.retro {
			padding: 2rem 2rem;
		}
	}
	.retro-avatar {
		width: 50px;
		border-radius: 50%;
		box-shadow: 1px 1px 1px 1px var(--pico-color);
	}
	.retro-name {
		display: inline-block;
		vertical-align: middle;
		margin: 0 0 0 1rem;
	}
	.retro span {
		color: var(--pico-span-color);
	}
	.retro-links {
		display: flex;
		gap: 25px;
	}
	.retro-link-label {
		display: block;
		color: #d0dec5 !important;
		font-size: 1.2rem;
		font-weight: bold;
		text-align: center;
		text-transform: uppercase;
	}
	.retro-link-url {
		color: #d0dec5 !important;
		font-size: 0.8rem;
	}
	.retro-link {
		text-decoration: none;
		color: #d0dec5;
		display: block;
		margin: 20px 0;
		border: 1px solid #d0dec5;
		padding: 8px 13px;
		border-radius: 7px;
	}
	.retro-link:hover {
		background-color: #d0dec5;
	}
	.retro-link:hover .retro-link-label,
	.retro-link:hover .retro-link-url {
		color: #000 !important;
	}
	.retro-tags {
		display: flex;
		text-align: center;
		align-items: center;
		justify-content: center;
		margin-top: 2rem;
	}
	.retro-tag {
		color: #63e400;
		margin: 1ex;
	}
	.retro-tag::before {
		content: '#';
	}
</style>
