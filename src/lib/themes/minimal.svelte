<script lang="ts">
	import type { Profile } from '../../routes/(app)/auth/v1/account/proxy+page.server';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import test from 'node:test';
	export let profile: Profile;
	export let token;
	export let is_author;

	const avatar = `/u/${profile.username}/avatar`;
	const fallbackAvatar = `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${profile.username}`;

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
	const ShortDescription = () => {
		return [
			profile.username,
			printWorkCapacity(profile.work_capacity),
			printWorkCompensation(profile.work_compensation),
			profile.location
		]
			.filter(Boolean)
			.join(' • ');
	};

	let initialLoaded = true;
	let unsavedChanges = false;
	$: {
		if (profile && !initialLoaded) {
			unsavedChanges = true;
		}
		initialLoaded = false;
	}

	const submitChanges = async () => {
		const formData = new FormData();
		for (const key in profile) {
			if (key === 'links') {
				const keyUrls = profile[key]?.map((link) => link.url);
				const keyLabels = profile[key]?.map((link) => link.label);
				formData.append('link-url', keyUrls);
				formData.append('link-label', keyLabels);
			}
			formData.append(key, profile[key]);
		}
		formData.append('token', token);
		fetch(`http://${env.PUBLIC_DOMAIN}/account/update`, {
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
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/pico.css/dist/pico.min.css" />
</svelte:head>

{#if profile}
	<main class="container">
		<img
			src={avatar}
			width="200px"
			alt="Avatar"
			onerror={(ev: Event) => {
				console.log('Image error!!!');
				(ev.target as HTMLImageElement).src = fallbackAvatar;
			}}
		/>
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
			<span>{printWorkCompensation(profile.work_compensation)}</span> •
			<span>{printWorkCapacity(profile.work_capacity)}</span> •
			{#if is_author}
				<span contenteditable="true" bind:textContent={profile.location}></span>
			{:else}
				<span>{profile.location}</span>
			{/if}
		</span>

		<div class="links">
			<a href={`${env.PUBLIC_URL}/u/${profile.username}`}>Weird</a>
			{#if profile.links}
				{#each profile.links as link}
					{#if is_author}
						<a href={link.url} contenteditable="true" bind:textContent={link.label}>
							{link.label || link.url}
						</a>
					{:else}
						<a href={link.url} target="_blank">
							{link.label || link.url}
						</a>
					{/if}
				{/each}
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
			<div>
				<span class="tags">
					{#each profile.tags as tag}
						{#if is_author}
							<a
								href={`${env.PUBLIC_URL}/members?q=${tag}`}
								target="_blank"
								contenteditable="true"
								bind:textContent={tag}
							>
								#{tag}
							</a>
						{:else}
							<a href={`${env.PUBLIC_URL}/members?q=${tag}`} target="_blank">
								#{tag}
							</a>
						{/if}
					{/each}
				</span>
			</div>
		{/if}
		<!-- this is so uglyy, thanks to pico, I'll fix this later -->
		{#if unsavedChanges}
			<div role="group" style="max-width: 800px;" class="unsaved-changes">
				<p>You have unsaved changes.</p>
				<button class="btn" onclick={submitChanges}> Save </button>
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
	.tags a {
		padding: 0.25em;
	}
	.links {
		margin: 0.5em;
		display: flex;
	}
	.links a {
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
</style>
