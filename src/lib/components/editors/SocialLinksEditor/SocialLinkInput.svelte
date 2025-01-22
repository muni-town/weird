<script lang="ts">
	import SocialLinkIcon from '$lib/components/social-media/SocialLinkIcon.svelte';

	let { url = $bindable() }: { url: string } = $props();

	let input: HTMLInputElement;
	export function focus() {
		input.focus();
	}
</script>

<div>
	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim">
			<SocialLinkIcon {url} />
		</div>
		<input type="text" bind:this={input} placeholder="https://example.com" bind:value={url} />
	</div>
</div>
