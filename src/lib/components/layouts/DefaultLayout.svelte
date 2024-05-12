<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar>
	<svelte:fragment slot="lead">&nbsp;</svelte:fragment>
	<svelte:fragment slot="default"
		><h1 class="text-xl font-bold"><a href="/">Weird.one</a></h1></svelte:fragment
	>
	<svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
</AppBar>

<slot></slot>

<style>
</style>
