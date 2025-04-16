<script lang="ts">
	import type { PageData } from './$types';
	import { env } from '$env/dynamic/public';

	import { checkResponse } from '$lib/utils/http';
	import { onMount } from 'svelte';
	import getPkce from 'oauth-pkce';

	import LoginPage from './components/LoginPage.svelte';

	const { data }: { data: PageData } = $props();
	const providers = data.providers;

	let clientId = $state('');
	let redirectUri = $state('');
	let nonce = $state('');
	let scopes = $state([] as string[]);
	let oidcState = $state('');
	let challenge = $state('');
	let challengeMethod = $state('');
	let loading = $state(false);

	let justResetPassword = $state(false);

	const getKey = (i: number) => {
		let res = '';

		const target = i || 8;
		for (let i = 0; i < target; i += 1) {
			let nextNumber = 60;
			while ((nextNumber > 57 && nextNumber < 65) || (nextNumber > 90 && nextNumber < 97)) {
				nextNumber = Math.floor(Math.random() * 74) + 48;
			}
			res = res.concat(String.fromCharCode(nextNumber));
		}

		return res;
	};

	async function handleAuthResp(authResp: Response, isRefresh = false) {
		if (authResp.status == 202) {
			const redirectUri = authResp.headers.get('location');
			window.location.href = redirectUri!;
		} else if (!authResp.ok) {
			if (!isRefresh) {
				error = 'Invalid email or password.';
			}
			loading = false;
		}
	}

	function providerLogin(id: string) {
		getPkce(64, (error, { challenge, verifier }) => {
			if (!error) {
				localStorage.setItem('pkceVerifierUpstream', verifier);
				providerLoginPkce(id, challenge);
			}
		});
	}

	async function providerLoginPkce(id: string, pkce_challenge: string) {
		let data = {
			email: null,
			client_id: clientId,
			redirect_uri: redirectUri,
			scopes: scopes,
			state: oidcState,
			nonce: nonce,
			code_challenge: challenge,
			code_challenge_method: challengeMethod,
			provider_id: id,
			pkce_challenge
		};
		try {
			let res = await fetch('/auth/v1/providers/login', {
				method: 'post',
				body: JSON.stringify(data),
				headers: [
					['x-csrf-token', localStorage.getItem('csrfToken')!],
					['content-type', 'application/json']
				]
			});
			await checkResponse(res);
			const xsrfToken = await res.text();
			localStorage.setItem('providerToken', xsrfToken);

			window.location.href = res.headers.get('location')!;
		} catch (e) {
			console.error('Error logging in with upstream provider', e);
		}
	}

	onMount(async () => {
		const url = new URL(window.location.href);
		const id = url.searchParams.get('client_id');

		await new Promise<void>((resolve) => {
			if (id) {
				clientId = id;
				redirectUri = url.searchParams.get('redirect_uri')!;
				nonce = url.searchParams.get('nonce')!;
				scopes = url.searchParams.get('scope')!.split(' ');
				oidcState = url.searchParams.get('state')!;
				challenge = url.searchParams.get('code_challenge')!;
				challengeMethod = url.searchParams.get('code_challenge_method')!;
				resolve();
			} else {
				// If the client ID is not set, then generate all the parameters for a local login
				clientId = 'rauthy';
				getPkce(64, async (error, { challenge: c, verifier }) => {
					if (!error) {
						localStorage.setItem('pkce_verifier', verifier);
						challengeMethod = 'S256';
						challenge = c;
						nonce = getKey(24);
						oidcState = 'account';
						redirectUri = `${window.location.origin}/auth/v1/oidc/callback`;
						scopes = ['openid', 'profile', 'email'];
					} else {
						console.log('Error generating pkce challenge', error);
					}
					resolve();
				});
			}
		});

		// If we already have a session, then we can just refresh, and redirect immediately.
		if (data.sessionInfo) {
			loading = true;
			const authResp = await fetch('/auth/v1/oidc/authorize/refresh', {
				method: 'post',
				body: JSON.stringify({
					client_id: clientId,
					redirect_uri: redirectUri,
					state: oidcState,
					code_challenge: challenge,
					code_challenge_method: challengeMethod,
					nonce: nonce,
					scopes
				}),
				headers: [
					['x-csrf-token', localStorage.getItem('csrfToken')!],
					['content-type', 'application/json']
				]
			});
			await handleAuthResp(authResp, true);
			return;
		}

		justResetPassword = localStorage.getItem('justResetPassword') == 'true';
		localStorage.removeItem('justResetPassword');

		const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
		await checkResponse(initResp);
		const init = await initResp.json();
		localStorage.setItem('csrfToken', init.csrf_token);
	});

	let error = $state('');

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();

		loading = true;

		const formData = new FormData(e.target as HTMLFormElement);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const req = {
			email,
			client_id: clientId,
			redirect_uri: redirectUri,
			state: oidcState,
			code_challenge: challenge,
			code_challenge_method: challengeMethod,
			nonce: nonce,
			scopes,
			password
		};

		const authResp = await fetch('/auth/v1/oidc/authorize', {
			method: 'post',
			body: JSON.stringify(req),
			headers: [
				['x-csrf-token', localStorage.getItem('csrfToken')!],
				['content-type', 'application/json']
			]
		});
		await handleAuthResp(authResp);
	}

	const pageTitle = `Login | ${env.PUBLIC_INSTANCE_NAME}`;
</script>

<LoginPage
	{pageTitle}
	{justResetPassword}
	{loading}
	{error}
	{providers}
	{providerLogin}
	{onsubmit}
/>
