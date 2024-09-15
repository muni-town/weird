<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	const { data: pageData }: { data: PageData } = $props();

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
		// send formdata to /auth/account/update
		const form_data = new FormData();
		form_data.append('mastodon_server', mastodon_server);
		form_data.append('mastodon_username', user_data.username);

		await fetch('/account/update', {
			method: 'POST',
			body: form_data
		})
			.then((res) => console.log(res.json()))
			.catch((err) => console.log(err));
		localStorage.removeItem('reloaded');
		window.location.href = `/${pageData.profile.username}/mastodon`;
	});
</script>
