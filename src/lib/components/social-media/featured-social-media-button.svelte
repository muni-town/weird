<script lang="ts">
	import { getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';
	import SocialLinkIcon from './SocialLinkIcon.svelte';

	let { url, verified = true }: { url: string; verified: boolean } = $props();

	const socialMedia = $derived(getSocialMediaDetails(url));
</script>

<div class="relative">
	{#if verified}
		<span class="badge-icon absolute -right-1 -top-2 z-10">
			<Icon icon="ph:seal-check-fill" font-size="40" class="text-blue-400" />
		</span>
	{/if}
	<a
		href={url}
		target="_blank"
		title={socialMedia.name}
		class="variant-outline-primary btn h-11 w-11"
	>
		<span>
			<SocialLinkIcon {url} />
		</span>
	</a>
</div>
