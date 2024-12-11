<script lang="ts">
	import type { ActionData, PageData } from './$types';

	import ClaimHandlePage from './components/ClaimHandlePage.svelte';

	const { form, data }: { form: ActionData; data: PageData } = $props();
	const action = '?/claimHandle';
</script>

<ClaimHandlePage {form} {action} subscriptionInfo={data.subscriptionInfo} />
