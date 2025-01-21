<script lang="ts">
	import SocialLinkIcon from '$lib/components/social-media/SocialLinkIcon.svelte';
	import { clientGetFaviconDataUri } from '$lib/utils/social-links';

	let { url = $bindable() }: { url: string } = $props();

	let imgSrc = $state('');
	$effect(() => {
		if (url.length > 0) {
			clientGetFaviconDataUri(url).then((url) => {
				if (url) {
					imgSrc = url;
				}
			});
		}
	});

	let input: HTMLInputElement;
	export function focus() {
		input.focus();
	}
</script>

<div>
	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim !text-white">
			<SocialLinkIcon {url} />
		</div>
		<input type="text" bind:this={input} placeholder="https://example.com" bind:value={url} />
	</div>
</div>
