<script lang="ts">
	import { get_pow_challenge } from '$lib/rauthy/client';
	import { checkResponse } from '$lib/utils';
	import { env } from '$env/dynamic/public';
	import { Pow } from '$lib/pow';

	let processing = $state(false);
	let error: string | null = $state(null);
	let email = $state('');
	let pow: string | undefined = $state(undefined);

	async function handleSubmit(event: SubmitEvent) {
		processing = true;
		event.preventDefault();
		try {
			let challenge = await get_pow_challenge();
			console.debug('Computing proof of work');
			console.log(challenge);
			pow = Pow.work(challenge);
			console.debug('Completed proof of work', pow);
			if (!pow) {
				error = 'Error computing proof of work.';
				processing = false;
				return;
			}
		} catch (e) {
			processing = false;
			error = `Error computing proof of work: ${e}`;
			return;
		}

		try {
			const home = new URL(window.location.href);
			home.pathname = '/my-profile';
			const registerResp = await fetch('/auth/v1/users/register', {
				method: 'post',
				body: JSON.stringify({
					email,
					given_name: 'Weird',
					family_name: 'User',
					// This isn't really used, we do the redirect manually.
					redirect_uri: home,
					pow
				})
			});
			await checkResponse(registerResp);

			window.location.replace('/account/register/confirmation');
		} catch (e) {
			processing = false;
			error = `Error registering user: ${JSON.stringify(e)}`;
			return;
		}
	}
</script>

<svelte:head>
	<title>Register | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" onsubmit={handleSubmit}>
		{#if error}
			<div class="rounded-sm bg-error-500 p-3">
				Error registering user: {error}
			</div>
		{/if}
		<h1 class="my-3 text-2xl">Register New Account</h1>
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="text" placeholder="Email" bind:value={email} />
		</label>
		<input type="hidden" name="pow" value="" />

		<p class="mt-4">
			Already have an account? <a href="/my-profile" class="underline">Login</a>.
		</p>

		<button class="variant-filled btn" disabled={processing}>
			{processing ? 'Loading...' : 'Register'}
		</button>
	</form>
</main>
