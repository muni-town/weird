<script lang="ts">
	import type { LayoutData } from './$types';
	import OuterLayout from '$lib/components/layouts/OuterLayout.svelte';
	import '../../app.css';
	import type { Snippet } from 'svelte';
	import { initializeStores, Drawer, getDrawerStore, Modal, Toast } from '@skeletonlabs/skeleton';
	initializeStores();

	const drawerStore = getDrawerStore();
	const closeDrawer = () => drawerStore.close();

	const { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<Modal />
<Toast />

<OuterLayout sessionInfo={data.sessionInfo}>
	{@render children()}
</OuterLayout>
