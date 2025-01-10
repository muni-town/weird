<script lang="ts">
	import { getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	let {
		label = '',
		url,
		verified = false,
		rel
	}: { label?: string; url: string; verified?: boolean; rel?: string } = $props();
	const socialMedia = getSocialMediaDetails(url);
</script>

<div class="relative text-black">
	{#if verified}
		<span class="badge-icon absolute -right-1 -top-2 z-10">
			<Icon icon="ph:seal-check-fill" font-size="40" class="text-blue-400" />
		</span>
	{/if}

	<a href={url} target="_blank" class="link" {rel}>
		{#if socialMedia?.icon}
			<span>
				<Icon icon={socialMedia.icon} class="h-6 w-6" />
			</span>
		{/if}

		<span>{label || socialMedia?.name} </span>
	</a>
</div>

<style>
	.link {
		display: flex;
		flex-direction: columns;
		gap: 0.5rem;
		color: black;
		font-family: 'Rubik Mono One';
		background-color: #a092e3;
		padding: var(--size-fluid-1) var(--size-fluid-2);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-2);
		box-shadow: 0.35rem 0.45rem black;
		text-decoration: none;
		text-align: center;
	}
</style>
