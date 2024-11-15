<script>
	import { getFeaturedSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	export let url;

	const featuredSocialMedia = getFeaturedSocialMediaDetails(url);
</script>

{#if featuredSocialMedia}
	<a
		href={url}
		target="_blank"
		title={featuredSocialMedia.name}
		class="variant-outline-primary btn btn-icon-sm"
	>
		<span>
			<Icon icon={featuredSocialMedia.icon} class="h-6 w-6" />
		</span>
	</a>
{/if}
