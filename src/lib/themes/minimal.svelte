<script lang="ts">
	import type { Profile } from '../../routes/(app)/auth/v1/account/proxy+page.server';
	import { env } from '$env/dynamic/public';
	import AvatarEditor from '$lib/components/avatar/editor.svelte';
	import EditLinks from '$lib/components/pubpage-admin/edit-links.svelte';

	let editingTags = false;
	let linkLabel = '';
	let linkUrl = '';

	export let profile: Profile;
	export let token;
	export let is_author;

	let avatar = `/u/${profile.username}/avatar`;
	let fallbackAvatar = `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${profile.username}`;

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
	let unsavedChanges = false;
	$: {
		if (profile && !initialLoaded) {
			unsavedChanges = true;
		}
		initialLoaded = false;
	}

	let editingAvatar = '';
	const ChangeAvatar = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			editingAvatar = e.target!.result as string;
		};
		reader.readAsDataURL(file);
	};

	const submitChanges = async () => {
		const formData = new FormData();
		for (const key in profile) {
			if (key === 'links') {
				profile[key]?.forEach((link) => {
					formData.append('link-url', link.url);
					formData.append('link-label', link.label);
				});
			}
			formData.append(key, profile[key]);
		}
		formData.append('token', token);
		const avatar_blob = await fetch(avatar)
			.then((res) => res.blob())
			.then((blob) => new File([blob], 'avatar.png', { type: 'image/png' }));

		formData.append('avatar', avatar_blob, 'avatar.png');
		fetch(`${env.PUBLIC_URL}/account/update`, {
			method: 'POST',
			body: formData,
			mode: 'cors'
		})
			.then((res) => res.json())
			.then((data) => {
				unsavedChanges = false;
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const editLinkCallback = (label: string, url: string) => {
		editingTags = false;
		unsavedChanges = true;
		profile.links = profile.links.map((link) => {
			if (link.label === linkLabel && link.url === linkUrl) {
				link.url = url;
				link.label = label;
			}
			return link;
		});
		if (linkLabel === '' && linkUrl === '') {
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
				unsavedChanges = true;
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
						onclick={() => document.querySelector('input[name="avatar"]').click()}
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
					(ev.target as HTMLImageElement).src = fallback;
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
			<span>{profile.username}</span> •
			{#if env.PUBLIC_SHOW_WORK_CAPACITY == 'true'}
				{#if is_author}
					<select bind:value={profile.work_compensation} style="width: fit-content;">
						<option value="">Not Specified</option>
						<option value="paid">Paid</option>
						<option value="volunteer">Volunteer</option>
					</select>
				{:else}
					<span>{printWorkCompensation(profile.work_compensation)}</span> •
				{/if}
				{#if is_author}
					<select bind:value={profile.work_capacity} style="width: fit-content;">
						<option value="">Not Specified</option>
						<option value="full_time">Full Time</option>
						<option value="part_time">Part Time</option>
					</select>
				{:else}
					<span>{printWorkCapacity(profile.work_capacity)}</span> •
				{/if}
			{/if}
			{#if is_author}
				<span contenteditable="true" bind:textContent={profile.location}></span>
			{:else}
				<span>{profile.location}</span>
			{/if}
		</span>

		<div class="links">
			<a href={`${env.PUBLIC_URL}/u/${profile.username}`} class="link">Weird</a>
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
		<!-- this is so uglyy, thanks to pico, I'll fix this later -->
		{#if unsavedChanges}
			<div role="group" style="max-width: 800px;" class="unsaved-changes">
				<p>You have unsaved changes.</p>
				<button class="btn" onclick={() => submitChanges()}> Save </button>
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

	.unsaved-changes {
		padding: 0.75rem 1.25rem;
		margin: 1em;
		border: 1px solid;
		border-radius: 0.25rem;
		position: fixed;
		bottom: 2em;
		background-color: var(--pico-contrast-background);
	}
	.unsaved-changes button {
		padding: none;
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
