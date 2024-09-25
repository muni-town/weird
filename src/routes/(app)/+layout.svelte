<script lang="ts">
	import type { LayoutData } from './$types';
	import OuterLayout from '$lib/components/layouts/OuterLayout.svelte';
	import '../../app.css';
	import type { Snippet } from 'svelte';
	import { initializeStores, Modal, Toast } from '@skeletonlabs/skeleton';

	const { data, children }: { data: LayoutData; children: Snippet } = $props();

	initializeStores();
</script>

<Modal />
<Toast />

<OuterLayout sessionInfo={data.sessionInfo}>
	{@render children()}
</OuterLayout>
