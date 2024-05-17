<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar>
	<svelte:fragment slot="lead"><img src="/logo.png" alt="Weird Logo" width="40px" /></svelte:fragment>
	<svelte:fragment slot="default"
		><h1 class="text-xl font-bold"><a href="/">Weird.one</a></h1></svelte:fragment
	>
	<svelte:fragment slot="trail">
		<a href="/auth/v1/account" class="btn variant-ghost">Login</a>
		<a href="/account/register" class="btn variant-ghost">Register</a>
		<LightSwitch />
	</svelte:fragment>
</AppBar>

<slot></slot>

<style>
</style>
