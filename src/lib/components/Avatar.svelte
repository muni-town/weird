<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Avatar } from '@skeletonlabs/skeleton';

	const baseUrl = env.PUBLIC_DICEBEAR_URL + '/8.x/bottts/svg?seed=';

	let { seed, width }: { seed: string; width?: string } = $props();
</script>

<Avatar
	background="bg-transparent"
	src={`${baseUrl}${seed}`}
	rounded="rounded-full"
	width={width || 'w-32'}
/>
