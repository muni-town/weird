<script>
	import { getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	export let label = '';
	export let url;
	export let verified = false;
	const socialMedia = getSocialMediaDetails(url);
</script>

<div class="relative">
	{#if verified}
		<span class="badge-icon absolute -right-1 -top-2 z-10">
			<Icon icon="ph:seal-check-fill" font-size="40" class="text-blue-400" />
		</span>
	{/if}

	<a href={url} target="_blank" class="variant-filled btn">
		{#if socialMedia?.icon}
			<span>
				<Icon icon={socialMedia.icon} class="h-6 w-6" />
			</span>
		{/if}

		<span>{label || socialMedia?.name} </span>
	</a>
</div>
