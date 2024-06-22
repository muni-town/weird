<script lang="ts">
	import type { PageData, ActionData } from './$types';

	import { onMount } from 'svelte';

	const { form }: { data: PageData; form: ActionData } = $props();

	onMount(() => {
		if (!form?.error) {
			window.location.href = '/auth/v1/account';
		}
	});
</script>

{#if form?.error}
	<main class="flex flex-col items-center">
		<aside class="alert variant-ghost-error mt-8">
			<div class="alert-message">
				<p>{form.error}</p>
			</div>
		</aside>
	</main>
{/if}
