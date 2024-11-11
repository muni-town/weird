<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	let { src, width }: { src?: string; width?: string } = $props();
	let computedSrc = $derived(src || '/default-avatar.svg');
</script>

<Avatar
	background="bg-transparent"
	src={computedSrc}
	rounded="rounded-full"
	width={width || 'w-32'}
/>
