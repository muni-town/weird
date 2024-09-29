<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import ProfilePage from './components/ProfilePage.svelte';

	const { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<ProfilePage {data} {form} />
