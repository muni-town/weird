<script lang="ts">
	interface props {
		pageTitle: string;
		success: boolean;
		onsubmit: (event: SubmitEvent) => void;
	}

	import ForgetPasswordForm from './ForgetPasswordForm.svelte';

	const { pageTitle, success, onsubmit }: props = $props();
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<ForgetPasswordForm {success} {onsubmit} />
</main>
