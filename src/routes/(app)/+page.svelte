<script>
	import { env } from '$env/dynamic/public';
	import ScreenIcon from '$lib/icons/ScreenIcon.svelte';
	import KeyboardIcon from '$lib/icons/KeyboardIcon.svelte';
	import WireIcon from '$lib/icons/WireIcon.svelte';
</script>

<svelte:head>
	<title>{env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="container mx-auto">
	<div class="mt-8 p-1 text-center">
		<h1
			class="text-8xl font-black uppercase text-yellow-200 drop-shadow-[0_6.20px_7.20px_rgba(2,5,0,0.8)]"
		>
			weird
		</h1>
		<h3 class="ml-10 text-2xl font-bold text-white">a way to be on the we|</h3>
	</div>

	<div class="mt-20 flex px-2">
		<div class="relative -top-24 left-44">
			<KeyboardIcon />
		</div>
		<div class="relative right-0 -z-10">
			<WireIcon />
		</div>
		<div class="relative right-72 top-10">
			<ScreenIcon />
		</div>
	</div>
</main>
