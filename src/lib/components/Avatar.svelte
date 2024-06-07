<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Avatar } from '@skeletonlabs/skeleton';

	const baseUrl = env.PUBLIC_DICEBEAR_URL + '/8.x/bottts/svg?seed=';

	let { username }: { username: string } = $props();
</script>

<Avatar
	background="bg-transparent"
	src={`${baseUrl}${username}`}
	rounded="rounded-full"
	width="w-32"
/>
