<script lang="ts">
	import { env } from '$env/dynamic/public';
	import SuccessMessage from './SuccessMessage.svelte';
</script>

<svelte:head>
	<title>Account Created | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<SuccessMessage />
</main>
