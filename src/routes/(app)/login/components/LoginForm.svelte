<script lang="ts">
	import type { PageData } from '../$types';

	interface props {
		loading: boolean;
		error: string;
		providers: PageData['providers'];
		justResetPassword: boolean;
		onsubmit: (event: SubmitEvent) => void;
		providerLogin: (id: string) => void;
	}

	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import ProviderLoginButtons from './ProviderLoginButtons.svelte';

	const { loading, error, providers, justResetPassword, onsubmit, providerLogin }: props = $props();
</script>

<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8" {onsubmit}>
	<h1 class="my-3 text-2xl">Login</h1>

	{#if loading}
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
			<input name="email" class="input" type="text" placeholder="Email" />
		</label>

		<label class="label">
			<span>Password</span>
			<input name="password" class="input" type="password" placeholder="Password" />
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

			<button type="submit" class="variant-filled btn">Login</button>

			<ProviderLoginButtons {providers} {providerLogin} />
		</div>
	{/if}
</form>
