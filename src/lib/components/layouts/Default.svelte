<script>
	import { env } from '$env/dynamic/public';
	import NavBar from '$lib/components/layouts/Navbar.svelte';
</script>

<svelte:head>
	<title>{env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<div
	class="absolute top-0 z-[-2] h-screen w-screen bg-white bg-[radial-gradient(#ffffff33_1px,#581c87_1px)] bg-[size:20px_20px]"
>
	<NavBar />

	<div>
		<slot></slot>
	</div>
</div>
