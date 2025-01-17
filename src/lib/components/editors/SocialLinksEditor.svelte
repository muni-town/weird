<script lang="ts">
	import SocialLinkInput from './SocialLinksEditor/SocialLinkInput.svelte';
	import { onMount } from 'svelte';
	import { getSocialMediaDetails } from '$lib/utils/social-links';

	let { links = $bindable() }: { links: { label?: string; url: string }[] } = $props();

	let localLinks = $state([]) as typeof links;
	onMount(() => {
		localLinks = links;
	});
	$effect(() => {
		links = localLinks
			.filter((x) => !!x.url)
			.map((x) => ({ url: x.url, label: getSocialMediaDetails(x.url).name }));
	});

	$effect(() => {
		const lastLink = localLinks[localLinks.length - 1];
		const secondToLastLink = localLinks[localLinks.length - 2];
		if (!lastLink || lastLink.url !== '') {
			localLinks.push({ url: '' });
		} else if (secondToLastLink && secondToLastLink.url === '' && lastLink.url === '') {
			localLinks.pop();
		}
		if (localLinks.slice(0, -1).some((x) => !x.url)) {
			localLinks = [...localLinks.filter((x) => !!x.url), localLinks[localLinks.length - 1]];
		}
	});
</script>

{#each localLinks as link, i (i)}
	<SocialLinkInput bind:url={link.url} />
{/each}
