<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import ProfilePage from './components/ProfilePage.svelte';
	import ClaimUsernamePage from './components/ClaimUsernamePage.svelte';

	const { data, form }: { data: PageData; form: ActionData } = $props();
</script>

{#if data.profile?.username}
	<ProfilePage {data} {form} />
{:else}
	<ClaimUsernamePage {data} {form} />
{/if}
