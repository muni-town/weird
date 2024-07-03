<script lang="ts">
	import getPkce from 'oauth-pkce';
	import { getUserInfo } from '$lib/rauthy';
	import { env } from '$env/dynamic/public';
	import type { WorkCapacity, WorkCompensation } from '../../auth/v1/account/proxy+page.server';
	import type { PageData } from './$types';
	import Avatar from '$lib/components/Avatar.svelte';
	import { parseUsername } from '$lib/utils';
	import { onMount } from 'svelte';

	const { data }: { data: PageData } = $props();

	const profiles = data.profiles;
	const parsedUsername =
		(data.profile?.username && parseUsername(data.profile.username)) || undefined;

	let username = $state(parsedUsername?.name || '');
	let display_name = $state(data.profile?.display_name || '');
	let avatar_seed = $state(data.profile?.avatar_seed || data.profile?.username || '');
	let location = $state(data.profile?.location || '');
	let contact_info = $state(data.profile?.contact_info || '');
	let work_capacity = $state(data.profile?.work_capacity);
	let work_compensation = $state(data.profile?.work_compensation);
	let bio = $state(data.profile?.bio || '');
	let links = $state(data.profile?.links || []);
	let tags = $state(data.profile?.tags || []);
	onMount(async () => {
		const url = new URL(window.location.href);
		const code = url.searchParams.get('code');
		if (!code) return;

		const reloaded = localStorage.getItem('reloaded');
		// FIX: user information is not loaded directly after redirecting from mastodon
		await new Promise((resolve) => setTimeout(resolve, 1000));
		if (!reloaded) {
			localStorage.setItem('reloaded', 'true');
			window.location.reload();
			return;
		}

		const app_data = JSON.parse(localStorage.getItem('app_data') ?? '');
		const mastodon_server = app_data.mastodon_server;

		const response = await fetch(`${mastodon_server}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: app_data.client_id,
				client_secret: app_data.client_secret,
				code: code,
				grant_type: 'authorization_code',
				redirect_uri: app_data.redirect_uri
			})
		});
		const data = await response.json();

		localStorage.setItem('access_token', data.access_token);
		localStorage.setItem('mastodon_server', mastodon_server);

		// get user info
		const user_response = await fetch(`${mastodon_server}/api/v1/accounts/verify_credentials`, {
			headers: {
				Authorization: `Bearer ${data.access_token}`
			}
		});
		const user_data = await user_response.json();
		console.log(user_data, work_capacity);
		// send formdata to /auth/account/update
		const form_data = new FormData();
		form_data.append('mastodon_server', mastodon_server);
		form_data.append('mastodon_username', user_data.username);
		form_data.append('mastodon_access_token', data.access_token);
		form_data.append('username', username);
		form_data.append('display_name', display_name);
		form_data.append('avatar_seed', avatar_seed);
		form_data.append('location', location);
		form_data.append('contact_info', contact_info);
		form_data.append('work_capacity', work_capacity ?? 'full_time');
		form_data.append('work_compensation', work_compensation ?? 'paid');
		form_data.append('bio', bio);
		form_data.append('tags', tags.join(','));
		links.forEach((link) => {
			form_data.append('link-label', link.label ?? '');
			form_data.append('link-url', link.url ?? '');
		});

		await fetch('/account/update', {
			method: 'POST',
			body: form_data
		})
			.then((res) => console.log(res.json()))
			.catch((err) => console.log(err));
		localStorage.removeItem('reloaded');
		window.location.href = `/u/${username}/mastodon`;
	});
</script>
