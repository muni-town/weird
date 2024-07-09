<script>
	import { env } from '$env/dynamic/public';
	import { GH_OAUTH_URI } from '$lib/constants';

	const clientId = env.PUBLIC_GH_CLIENT_ID;
	const redirectUri = env.PUBLIC_GH_REDIRECT_URI;
	const githubAuthUrl = `${GH_OAUTH_URI}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
</script>

<div class="flex justify-center py-10">
	<a href={githubAuthUrl} class="rounded-md bg-gray-700 px-4 py-3 text-white hover:bg-gray-800"
		>Connect with Github</a
	>
</div>
