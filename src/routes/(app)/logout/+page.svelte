<script lang="ts">
	import { checkResponse } from '$lib/utils/http';
	import { onMount } from 'svelte';

	onMount(async () => {
		const url = new URL(window.location.href);
		const postLogoutUri = decodeURIComponent(
			url.searchParams.get('post_logout_redirect_uri') || '/'
		);
		const token = url.searchParams.get('id_token_hint');
		const state = url.searchParams.get('state');

		const csrf = localStorage.getItem('csrfToken');

		const params = new URLSearchParams();
		token && params.set('id_token_hint', token);
		params.set('post_logout_redirect_uri', postLogoutUri);
		state && params.set('state', state);

		try {
			const resp = await fetch('/auth/v1/oidc/logout', {
				method: 'post',
				headers: [
					['accept', 'application/json'],
					['x-csrf-token', csrf!],
					['content-type', 'application/x-www-form-urlencoded']
				],
				body: params
			});
			await checkResponse(resp);
			localStorage.removeItem('csrfToken');
		} catch (e) {
			console.log(e);
		} finally {
			window.location.href = postLogoutUri;
		}
	});
</script>
