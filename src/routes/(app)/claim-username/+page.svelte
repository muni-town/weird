<script lang="ts">
	import type { ActionData } from './$types';

	import ClaimUsernamePage from './components/ClaimUsernamePage.svelte';

	export let form: ActionData;
	const action = '?/claimUsername';
</script>

<ClaimUsernamePage {form} {action} />
