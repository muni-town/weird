<script lang="ts">
	import type { PageData } from './$types';
	import Page from './components/Page.svelte';

	const { data }: { data: PageData } = $props();
</script>

<Page {...data} />
