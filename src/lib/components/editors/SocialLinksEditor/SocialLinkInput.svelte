<script lang="ts">
	import { getSocialMediaDetails } from '$lib/utils/social-links';
	import Icon from '@iconify/svelte';

	let { url = $bindable() }: { url: string } = $props();

	let linkDetails = $derived(getSocialMediaDetails(url));

	let input: HTMLInputElement;
	export function focus() {
		input.focus();
	}
</script>

<div>
	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim">
			<Icon icon={linkDetails.icon} />
		</div>
		<input type="text" bind:this={input} placeholder="https://example.com" bind:value={url} />
	</div>
</div>
