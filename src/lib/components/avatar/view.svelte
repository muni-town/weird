<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	let { user_id, username, width }: { user_id?: string; username?: string; width?: string } =
		$props();
	let src = $derived(
		(user_id && `/account/${user_id}/avatar`) || (username && `/${username}/avatar`)
	);
</script>

<Avatar background="bg-transparent" {src} rounded="rounded-full" width={width || 'w-32'} />
