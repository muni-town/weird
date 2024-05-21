<script>
	import { getUserInfo } from '$lib/rauthy';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';

	const userInfo = getUserInfo();
</script>

<AppBar>
	<svelte:fragment slot="lead"
		><img src="/logo.png" alt="Weird Logo" width="40px" /></svelte:fragment
	>
	<svelte:fragment slot="default"
		><h1 class="text-xl font-bold"><a href="/">Weird.one</a></h1></svelte:fragment
	>
	<svelte:fragment slot="trail">
		{#if !userInfo}
			<a href="/auth/v1/account" class="variant-ghost btn">Login</a>
			<a href="/auth/v1/users/register" class="variant-ghost btn">Register</a>
		{:else}
			<a href="/auth/v1/account" class="variant-ghost btn">Profile</a>
			<a href="/auth/v1/oidc/logout" class="variant-ghost btn">Logout</a>
		{/if}
		<LightSwitch />
	</svelte:fragment>
</AppBar>

<slot></slot>

<style>
</style>
