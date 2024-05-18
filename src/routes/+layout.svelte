<script lang="ts">
	import type { LayoutData } from './$types';
	import DefaultLayout from '$lib/components/layouts/DefaultLayout.svelte';
	import '../app.css';
	import { setSessionInfo, setUserInfo } from '$lib/rauthy';

	const { data }: { data: LayoutData } = $props();
	setSessionInfo(data.sessionInfo);
	setUserInfo(data.userInfo);
</script>

<DefaultLayout>
	<slot />
</DefaultLayout>
