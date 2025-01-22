<script lang="ts">
	import { getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';
	let imageLoaded = $state(false);
	let { url, size = 25 }: { url: string; size?: number } = $props();
	let mediaInfo = $derived(getSocialMediaDetails(url));
	let faviconUrl: undefined | string = $state(undefined);
	// $effect(() => {
	// 	// If this is a generic icon because we couldn't find a specific one.
	// 	if (mediaInfo.icon == 'mdi:web') {
	// 		// clientGetFaviconDataUri(url).then((url) => (faviconUrl = url));
	// 	}
	// });
	let showImage = $derived(imageLoaded && faviconUrl);
</script>

<img
	alt="icon"
	style="max-width: unset"
	class:hidden={!showImage}
	width={size}
	height={size}
	src={faviconUrl}
	onload={() => (imageLoaded = true)}
	onerror={() => (imageLoaded = false)}
/>
<span class:hidden={showImage}>
	<Icon icon={mediaInfo.icon} font-size={size} />
</span>
