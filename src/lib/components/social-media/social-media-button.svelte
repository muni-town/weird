<script>
	import { getSocialMediaDetails, socialMediaConfig } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	export let url;
	const socialMedia = getSocialMediaDetails(url);
</script>

<a href={url} target="_blank" class="variant-filled btn">
	{#if socialMedia?.icon}
		<span>
			<Icon icon={socialMedia.icon} class="h-6 w-6" />
		</span>
	{/if}

	<span>{socialMedia?.name} </span>
</a>
