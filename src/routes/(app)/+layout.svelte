<script lang="ts">
	import type { LayoutData } from './$types';
	import OuterLayout from '$lib/components/layouts/OuterLayout.svelte';
	import '../../app.css';
	import type { Snippet } from 'svelte';

	const { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<OuterLayout userInfo={data.userInfo}>
	{@render children()}
</OuterLayout>
