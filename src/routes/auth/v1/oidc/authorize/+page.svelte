<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { getUserInfo } from '$lib/rauthy';
	import { checkResponse } from '$lib/utils';
	import { onMount } from 'svelte';

	const userInfo = getUserInfo();

	let clientId = $state('');
	let redirectUri = $state('');
	let nonce = $state('');
	let scopes = $state([] as string[]);
	let oidcState = $state('');
	let challenge = $state('');
	let challengeMethod = $state('');
	let refreshing = $state(false);
	let loggingIn = $state(false);

	let justResetPassword = $state(false);

	async function handleAuthResp(authResp: Response) {
		if (authResp.status == 202) {
			window.location.replace(authResp.headers.get('location')!);
		} else if (!authResp.ok) {
			console.error('Error logging in', authResp, await authResp.text());
			error = 'Invalid email or password.';
			password = '';
			loggingIn = false;
		}
	}

	onMount(async () => {
		const url = new URL(window.location.href);
		clientId = url.searchParams.get('client_id')!;
		redirectUri = url.searchParams.get('redirect_uri')!;
		nonce = url.searchParams.get('nonce')!;
		scopes = url.searchParams.get('scope')!.split(' ');
		oidcState = url.searchParams.get('state')!;
		challenge = url.searchParams.get('code_challenge')!;
		challengeMethod = url.searchParams.get('code_challenge_method')!;

		// If we already have a session, then we can just refresh, and redirect immediately.
		if (userInfo) {
			refreshing = true;
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
				headers: [['csrf-token', localStorage.getItem('csrfToken')!]]
			});
			await handleAuthResp(authResp);
			return;
		}

		justResetPassword = localStorage.getItem('justResetPassword') == 'true';
		localStorage.removeItem('justResetPassword');

		const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
		await checkResponse(initResp);
		const init = await initResp.json();
		localStorage.setItem('csrfToken', init.csrf_token);
	});

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		loggingIn = true;

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
			headers: [['csrf-token', localStorage.getItem('csrfToken')!]]
		});
		await handleAuthResp(authResp);
	}
</script>

<main class="flex flex-col items-center" onsubmit={onSubmit}>
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		<h1 class="my-3 text-2xl">Login</h1>

		{#if refreshing}
			<div class="flex justify-center p-5">
				<ProgressRadial width="w-20" />
			</div>
		{:else}
			{#if justResetPassword}
				<aside class="alert variant-ghost-success">
					<div class="alert-message">
						<p>Your password has been set, you may now login.</p>
					</div>
				</aside>
			{/if}

			{#if error}
				<aside class="alert variant-ghost-error">
					<div class="alert-message">
						<p>{error}</p>
					</div>
				</aside>
			{/if}

			<label class="label">
				<span>Email</span>
				<input name="email" class="input" type="text" placeholder="Email" bind:value={email} />
			</label>

			<label class="label">
				<span>Password</span>
				<input
					name="password"
					class="input"
					type="password"
					placeholder="Password"
					bind:value={password}
				/>
			</label>

			<div class="mt-4 flex flex-col gap-3">
				<div class="flex justify-center gap-4">
					<p class="text-center">
						<a href="/account/forgot-password" class="underline">Forgot your password?</a>
					</p>
					<p class="text-center">
						<a href="/auth/v1/users/register" class="underline">Don't have an account?</a>.
					</p>
				</div>

				<button class="variant-filled btn" disabled={loggingIn}>
					{!loggingIn ? 'Login' : 'Loading...'}
				</button>
			</div>
		{/if}
	</form>
</main>
