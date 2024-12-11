<script lang="ts">
	import type { UserSubscriptionInfo } from '$lib/billing';
	import ClaimHandleForm from './ClaimHandleForm.svelte';

	const {
		form,
		action,
		subscriptionInfo
	}: { form: any; action: string; subscriptionInfo: UserSubscriptionInfo } = $props();
	const error: string | undefined = form?.error;
</script>

<main class="flex flex-col items-center">
	<ClaimHandleForm {error} {action} {subscriptionInfo} />
</main>
