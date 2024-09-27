<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { checkResponse } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Policy = typeof data.passwordPolicy;
	type PolicyKey = keyof Policy;
	const passwordValidityLabels: { [K in PolicyKey]: string } = {
		include_digits: 'Include %s numbers',
		include_lower_case: 'Include %s lowercase',
		include_upper_case: 'Include &s uppercase',
		include_special: 'Include %s special characters',
		length_max: 'Shorter than %s',
		length_min: 'At least %s long',
		not_recently_used: 'Not one of your %s recently used passwords'
	};

	let password = $state('');
	let error = $state('');
	let passwordValidity: { [K in PolicyKey]?: { label: string; valid?: boolean } } = $state(
		Object.fromEntries(
			Object.entries(data.passwordPolicy)
				.filter(([_, value]) => !!value)
				.map(([key, value]) => [
					key,
					{
						label: passwordValidityLabels[key as PolicyKey].replace('%s', value.toString()),
						valid: false
					}
				])
		)
	);
	let passwordValid = $derived(Object.values(passwordValidity).every((x) => x.valid));

	$effect(() => {
		if (passwordValidity.length_min) {
			passwordValidity.length_min.valid = password.length >= data.passwordPolicy.length_min!;
		}
		if (passwordValidity.length_max) {
			passwordValidity.length_max.valid = password.length <= data.passwordPolicy.length_max!;
		}
		if (passwordValidity.include_lower_case) {
			passwordValidity.include_lower_case!.valid =
				password.replaceAll(/[a-z]/g, '').length >= data.passwordPolicy.include_lower_case!;
		}
		if (passwordValidity.include_upper_case) {
			passwordValidity.include_upper_case!.valid =
				password.replaceAll(/[A-Z]/g, '').length >= data.passwordPolicy.include_upper_case!;
		}
		if (passwordValidity.include_digits) {
			passwordValidity.include_digits!.valid =
				password.replaceAll(/[0-9]/g, '').length >= data.passwordPolicy.include_digits!;
		}
		if (passwordValidity.include_special) {
			passwordValidity.include_special.valid =
				password.replaceAll(/[!@#$%^&*()]/g, '').length >= data.passwordPolicy.include_special!;
		}
		if (passwordValidity.not_recently_used) {
			passwordValidity.not_recently_used.valid = undefined;
		}
	});

	onMount(() => {
		localStorage.setItem('justResetPassword', 'false');
	});

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		error = '';

		try {
			const resp = await fetch(`/auth/v1/users/${data.user}/reset`, {
				method: 'put',
				headers: [['pwd-csrf-token', data.csrfToken!]],
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

<svelte:head>
	<title>Set Password | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	{#if data.csrfToken}
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
				<div class="pl-4 text-sm">
					{#each Object.values(passwordValidity) as check}
						<div class="">
							{check.valid == undefined ? '⭕' : check.valid ? '✅' : '❌'}
							{check.label}
						</div>
					{/each}
				</div>
			</label>

			<button class="variant-filled btn" disabled={!passwordValid}> Set Password </button>
		</form>
	{:else}
		<aside class="alert variant-ghost-error m-8">
			<div class="alert-message">
				<p>
					This password reset link has expired, please request a new one if you still need to reset
					your password.
				</p>
			</div>
		</aside>
	{/if}
</main>
