<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	const url = new URL(data.url);
	const clientId = url.searchParams.get('client_id');
	const redirectUri = url.searchParams.get('redirect_uri');
	const nonce = url.searchParams.get('nonce');
	const scopes = url.searchParams.get('scope')?.split(' ');
	const oidcState = url.searchParams.get('state');
	const challenge = url.searchParams.get('code_challenge');
	const challengeMethod = url.searchParams.get('code_challenge_method');

	if (browser) {
		localStorage.setItem('csrfToken', data.csrfToken);
	}

	let email = $state('');
	let password = $state('');

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

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
			headers: {
				'csrf-token': localStorage.getItem('csrfToken')
			}
		});

		console.log(authResp);

		if (authResp.status == 202) {
			window.location.replace(authResp.headers.get('location')!);
		}
	}
</script>

<main class="flex flex-col items-center" onsubmit={onSubmit}>
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		<h1 class="my-3 text-2xl">Login</h1>
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

		<div class="mt-4 flex flex-col gap-2">
			<p class="text-center">
				Don't have an account?
				<a href="/account/register" class="underline">Register a new account</a>.
			</p>

			<button class="variant-filled btn"> Login </button>
		</div>
	</form>
</main>
