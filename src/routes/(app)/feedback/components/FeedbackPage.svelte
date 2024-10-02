<script lang="ts">
	interface props {
		pageTitle: string;
		handleSubmit: (event: SubmitEvent) => void;
		processing: boolean;
		error: string | null;
		powResult: string;
	}

	import FeedbackForm from './FeedbackForm.svelte';

	const { pageTitle, handleSubmit, processing, error, powResult }: props = $props();
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<FeedbackForm {handleSubmit} {processing} {error} {powResult} />
</main>
