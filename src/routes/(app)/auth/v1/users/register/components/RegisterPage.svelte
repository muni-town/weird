<script lang="ts">
	interface props {
		pageTitle: string;
		error: string;
		processing: boolean;
		onsubmit: (event: SubmitEvent) => void;
	}

	import RegisterForm from './RegisterForm.svelte';

	const { pageTitle, error, onsubmit, processing }: props = $props();
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<RegisterForm {error} {onsubmit} {processing} />
</main>
