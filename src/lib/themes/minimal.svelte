<script lang="ts">
	import { env } from '$env/dynamic/public';
	import AvatarEditor from '$lib/components/avatar/editor.svelte';
	import EditLinks from '$lib/components/pubpage-admin/edit-links.svelte';
	import type { Profile } from '$lib/leaf/profile';

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
	<main class="container">
		<EditLinks label={linkLabel} url={linkUrl} open={editingTags} saveCallback={editLinkCallback} />
		<input type="file" onchange={ChangeAvatar} name="avatar" style="display: none;" />
		{#if is_author}
			<figure class="avatar-figure">
				<img
					src={avatar}
					width="200px"
					alt="Avatar"
					onerror={(ev: Event) => {
						console.log('Image error!!!');
						(ev.target as HTMLImageElement).src = fallbackAvatar;
					}}
				/>
				<figcaption class="avatar-figcaption">
					<label
						for="avatar"
						onclick={() => document.querySelector('input[name="avatar"]')?.click()}
					>
						<img src="/edit-avatar.png" />
					</label>
				</figcaption>
			</figure>
		{:else}
			<img
				src={avatar}
				width="200px"
				alt="Avatar"
				onerror={(ev: Event) => {
					console.log('Image error!!!');
					(ev.target as HTMLImageElement).src = fallbackAvatar;
				}}
			/>
		{/if}
		{#if is_author}
			<h1
				contenteditable="true"
				bind:textContent={profile.display_name}
				style="margin-top: 1em;"
			></h1>
		{:else}
			<h1 style="margin-top: 1em;">{profile.display_name}</h1>
		{/if}
		<span>
			{profile.username}
		</span>

		<div class="links">
			<a href={`${env.PUBLIC_URL}/${profile.username}`} class="link">Weird</a>
			{#if profile.links}
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
						</a>
					{:else}
						<a href={link.url} target="_blank" class="link">
							{link.label || link.url}
						</a>
					{/if}
				{/each}
			{/if}
			{#if is_author}
				<span
					class="link"
					style="color: var(--pico-primary); cursor: pointer;"
					onclick={() => ((editingTags = true), (linkLabel = ''), (linkUrl = ''))}
					title="Add link"
				>
					+
				</span>
			{/if}
		</div>

		{#if profile.bio}
			{#if is_author}
				<p
					style="max-width: 800px; text-align:justify;"
					bind:textContent={profile.bio}
					contenteditable="true"
				></p>
			{:else}
				<p style="max-width: 800px; text-align:justify;">{profile.bio}</p>
			{/if}
		{/if}

		{#if profile.tags && profile.tags.length > 0}
			<div style="padding-bottom: 3rem;">
				<span class="tags">
					{#each profile.tags as tag}
						{#if is_author}
							<span contenteditable="true" bind:textContent={tag} class="tag">
								{tag}
							</span>
							<span
								style="color: var(--pico-del-color); cursor: pointer; margin-right: 1rem;"
								onclick={() => deleteTag(tag)}>&times;</span
							>
						{:else}
							<a href={`${env.PUBLIC_URL}/members?q=${tag}`} target="_blank" class="tag">
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
				</span>
			</div>
		{/if}
	</main>
{/if}

<style>
	main {
		margin-top: 1em;
		display: flex;
		align-items: center;
		flex-direction: column;
	}
	main img {
		border-radius: 100%;
		margin-top: 2em;
	}
	main p {
		padding: 1em;
		margin: 1em;
	}
	.tag {
		padding: 0.25em;
	}
	.tag::before {
		content: '#';
	}
	.links {
		margin: 0.5em;
		display: flex;
	}
	.link {
		margin: 0.5em;
	}

	.avatar-figure {
		position: relative;
	}
	.avatar-figure img {
		position: relative;
		z-index: -3;
	}
	.avatar-figcaption {
		position: absolute;
		bottom: 0;
		right: 0;
		border-radius: 100%;
		background-color: var(--pico-secondary);
		height: 70px;
		width: 70px;
		z-index: 1;
	}
	.avatar-figcaption img {
		height: 50px;
		width: 50px;
		display: block;
		margin: auto;
		margin-top: 0px;
		z-index: 2;
	}
</style>
