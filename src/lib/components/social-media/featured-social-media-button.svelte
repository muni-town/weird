<script>
	import { getFeaturedSocialMediaDetails, getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	export let url;

	const socialMedia = getSocialMediaDetails(url);
	const featuredSocialMedia = getFeaturedSocialMediaDetails(url);
</script>

<a
	href={url}
	target="_blank"
	title={featuredSocialMedia?.name || socialMedia.name}
	class="variant-outline-primary btn btn-icon-sm"
>
	<span>
		<Icon icon={featuredSocialMedia?.icon || socialMedia.icon} class="h-6 w-6" />
	</span>
</a>
