<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { checkResponse } from '$lib/utils';
	import { onMount } from 'svelte';

	let success = $state(false);
	let email = $state('');

	onMount(async () => {
		success = new URL(window.location.href).searchParams.get('success') != null;
		const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
		const init = await initResp.json();
		localStorage.setItem('csrfToken', init.csrf_token);
	});

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		try {
			const resp = await fetch(`/auth/v1/users/request_reset`, {
				method: 'post',
				body: JSON.stringify({ email }),
				headers: [['csrf-token', localStorage.getItem('csrfToken')!]]
			});
			await checkResponse(resp);
			localStorage.setItem('justResetPassword', 'true');
			window.location.replace('?success');
		} catch (e) {
			console.log(e);
		}
	}
</script>

<svelte:head>
	<title>Forgot Password | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" onsubmit={onSubmit}>
		<h1 class="my-3 text-2xl">Forgot Password</h1>

		{#if success}
			<aside class="alert variant-ghost-success">
				<div class="alert-message">
					<p>Your password reset email has been sent.</p>
				</div>
			</aside>
		{/if}

		<p>If you forgot your password, we can send you an email with a reset link.</p>
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="email" placeholder="Email" bind:value={email} />
		</label>

		<button class="variant-filled btn"> Send Link</button>
	</form>
</main>
