<script lang="ts">
	import type { ActionData } from './$types';

	import ClaimUsernamePage from './components/ClaimUsernamePage.svelte';

	export let form: ActionData;
</script>

<ClaimUsernamePage {form} />
