<script lang="ts">
	import ClaimUsernameForm from './ClaimUsernameForm.svelte';

	const { form }: { form: any } = $props();
	const error: string | undefined = form?.error;
</script>

<main class="flex flex-col items-center">
	<ClaimUsernameForm {error} />
</main>
