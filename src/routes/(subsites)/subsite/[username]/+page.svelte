<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { PageData } from './$types';
	import Minimal from '$lib/themes/minimal.svelte';
	import Retro from '$lib/themes/retro.svelte';
	// import Panel from '$lib/components/subsite-admin/panel.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { page } from '$app/stores';
	const { data }: { data: PageData } = $props();
	const profile: Profile = data.profile!;
	// const token = data.token!;
	// const is_author = data.is_author!;

	let theme: string = $state(profile.pubpage_theme || 'minimal');
	let unsavedChanges = $state(false);
	let avatar = $state(`/avatar`);

	let setUnsavedChanges = (value: boolean) => {
		unsavedChanges = value;
	};
	const setAvatar = (new_avatar: string) => {
		avatar = new_avatar;
		unsavedChanges = true;
	};

	const display_name = profile.display_name || $page.url.host;

	const submitChanges = async () => {
		alert('TODO: unimplemented.');
		// const formData = new FormData();
		// for (const key in profile) {
		// 	if (key === 'links') {
		// 		profile[key]?.forEach((link) => {
		// 			formData.append('link-url', link.url);
		// 			formData.append('link-label', link.label);
		// 		});
		// 	}
		// 	formData.append(key, profile[key]);
		// }
		// formData.append('token', token);
		// const avatar_blob = await fetch(avatar)
		// 	.then((res) => res.blob())
		// 	.then((blob) => new File([blob], 'avatar.png', { type: 'image/png' }));

		// formData.append('avatar', avatar_blob, 'avatar.png');
		// fetch(`${env.PUBLIC_URL}/account/update`, {
		// 	method: 'POST',
		// 	body: formData,
		// 	mode: 'cors'
		// })
		// 	.then((res) => res.json())
		// 	.then((data) => {
		// 		unsavedChanges = false;
		// 	})
		// 	.catch((err) => {
		// 		console.log(err);
		// 	});
	};
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="color-scheme" content="light dark" />
	<link rel="stylesheet" href="pico.min.css" />
	<title>{display_name}</title>
</svelte:head>

<!-- {#if is_author}
	<div class="subsite">
		<div class="subsite-theme">
			{#if theme === 'minimal'}
				<Minimal
					{profile}
					{token}
					{is_author}
					{setUnsavedChanges}
					{avatar}
					{fallbackAvatar}
					{setAvatar}
				/>
			{:else if theme === 'retro'}
				<Retro
					{profile}
					{token}
					{is_author}
					{setUnsavedChanges}
					{avatar}
					{fallbackAvatar}
					{setAvatar}
				/>
			{/if}
		</div>
		<div class="subsite-admin-panel">
			<Panel
				set_theme_callback={(new_theme: string) => {
					theme = new_theme;
					profile.subsite_theme = new_theme;
					unsavedChanges = true;
				}}
			/>
		</div>
	</div> -->
{#if theme === 'minimal'}
	<Minimal {profile} token={undefined} is_author={false} {setUnsavedChanges} {avatar} {setAvatar} />
{:else if theme === 'retro'}
	<Retro {profile} token={undefined} is_author={false} {setUnsavedChanges} {avatar} {setAvatar} />
{/if}

{#if unsavedChanges}
	<div role="group" style="max-width: 80vw;" class="unsaved-changes">
		<p>You have unsaved changes.</p>
		<button class="btn" onclick={() => submitChanges()}> Save </button>
	</div>
{/if}
<footer>
	Site generated with <a href="https://weird.one" target="_blank">Weird.One</a>.
</footer>

<style>
	footer {
		margin-left: 1em;
		margin-right: 1em;
		position: fixed;
		bottom: 0;
		text-align: center;
		width: 100%;
		margin-bottom: 0.5em;
	}
	.unsaved-changes {
		padding: 0.75rem 1.25rem;
		margin: 0 10vw;
		border: 1px solid;
		border-radius: 0.25rem;
		position: fixed;
		bottom: 2em;
		background-color: var(--pico-mark-background-color);
	}
	.unsaved-changes button {
		padding: none;
	}
</style>
