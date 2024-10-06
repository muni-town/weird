<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	let {
		user_id,
		src,
		username,
		width
	}: { user_id?: string; src?: string; username?: string; width?: string } = $props();
	let computedSrc = $derived(
		src || (user_id && `/account/${user_id}/avatar`) || (username && `/${username}/avatar`)
	);
</script>

<Avatar
	background="bg-transparent"
	src={computedSrc}
	rounded="rounded-full"
	width={width || 'w-32'}
/>
