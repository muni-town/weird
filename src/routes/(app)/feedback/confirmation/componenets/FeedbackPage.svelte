<script lang="ts">
	interface props {
		pageTitle: string;
	}

	const { pageTitle }: props = $props();
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<div class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		Your feedback was sent! Thank you for leaving a message, we may get back to you if you supplied
		an email address.
	</div>
</main>
