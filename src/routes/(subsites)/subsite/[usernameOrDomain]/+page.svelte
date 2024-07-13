<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { Profile } from '../../../(app)/auth/v1/account/proxy+page.server';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	const profile: Profile = data.profile!;
	const token = data.token!;
	const is_author = data.is_author!;
	const username = profile.username;

	const display_name = profile.display_name || (profile.username || '').split('@')[0];
	import Minimal from '$lib/themes/minimal.svelte';
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="color-scheme" content="light dark" />
	<link rel="stylesheet" href="pico.min.css" />
	<title>{display_name}</title>
</svelte:head>
<Minimal {profile} {token} {is_author} />
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
</style>
