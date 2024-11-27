<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	let { src, width }: { src?: string; width?: string } = $props();
</script>

<Avatar
	background="bg-transparent"
	src={src || '/default-avatar.svg'}
	rounded="rounded-full"
	width={width || 'w-32'}
/>
