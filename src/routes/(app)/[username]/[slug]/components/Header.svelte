<script lang="ts">
	import type { PageData } from '../$types';
	interface Props {
		username: PageData['username'];
		slug: PageData['slug'];
	}

	let { username, slug }: Props = $props();

	// TODO: maybe do this on the server?
	username = username?.includes('@') ? username.split('@')[0] : username;
</script>

<h1 class="mt-12 font-mono text-2xl">
	<a class="text-blue-600" href={`/${username}`}>
		{username}
	</a>
	<span>/ {slug}</span>
</h1>
