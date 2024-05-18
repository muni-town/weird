<script lang="ts">
	import { checkResponse } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let password = $state('');
	let error = $state('');

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		error = '';

		try {
			const resp = await fetch(`/auth/v1/users/${data.user}/reset`, {
				method: 'put',
				headers: [['pwd-csrf-token', data.csrfToken]],
				body: JSON.stringify({ magic_link_id: data.token, password })
			});
			await checkResponse(resp);
			localStorage.setItem('justResetPassword', 'true');
			window.location.replace('/auth/v1/account');
		} catch (e) {
			console.log(e);
			password = '';
			error = 'Error setting password.';
		}
	}
</script>

<main class="flex flex-col items-center">
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" onsubmit={onSubmit}>
		<h1 class="my-3 text-2xl">Set Password</h1>

		{#if error}
			<aside class="alert variant-ghost-error">
				<div class="alert-message">
					<p>{error}</p>
				</div>
			</aside>
		{/if}

		<p>Set a new password for your account.</p>
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

		<button class="variant-filled btn"> Set Password </button>
	</form>
</main>
