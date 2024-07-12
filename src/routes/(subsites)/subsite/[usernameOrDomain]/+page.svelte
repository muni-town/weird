<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const profile = data.profile;
	const username = profile.username;

	const display_name = profile.display_name || (profile.username || '').split('@')[0];

	const avatar = `/u/${username}/avatar`;
	const fallbackAvatar = `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${username}`;
</script>

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="color-scheme" content="light dark" />
		<link rel="stylesheet" href="pico.min.css" />
		<title>{display_name}</title>
	</head>
	<body>
		<main class="container">
			<h1><a href={`${env.PUBLIC_URL}/u/${username}`}>{display_name}</a></h1>

			<img
				src={avatar}
				width="200px"
				alt="Avatar"
				onerror={(ev: Event) => {
					console.log('Image error!!!');
					(ev.target as HTMLImageElement).src = fallbackAvatar;
				}}
			/>

			{#if profile.bio}
				<p>
					{profile.bio}
				</p>
			{/if}

			{#if profile.links}
				{#each profile.links as link}
					<div class="links">
						Links:
						<a href={link.url}>
							{link.label || link.url}
						</a>
					</div>
				{/each}
			{/if}

			{#if profile.tags && profile.tags.length > 0}
				<div>
					<strong>Tags: </strong>
					<span class="tags">
						{#each profile.tags as tag}
							<a href={`${env.PUBLIC_URL}/members?q=${tag}`} target="_blank">
								{tag}
							</a>
						{/each}
					</span>
				</div>
			{/if}

			{#if profile.location}
				<div>
					<strong>Location: </strong>
					{profile.location}
				</div>
			{/if}
		</main>
		<footer>
			Site generated with <a href="https://weird.one" target="_blank">Weird.One</a>.
		</footer>
	</body>
</html>

<style>
	main {
		margin-top: 2em;
		display: flex;
		align-items: center;
		flex-direction: column;
	}
	main img {
		border-radius: 100%;
		margin-top: 2em;
	}
	main p {
		padding: 1em;
		margin: 1em;
	}
	.tags a {
		padding: 0.25em;
	}
	.links {
		margin: 0.5em;
	}
	footer {
		margin-left: 1em;
		margin-right: 1em;
		position: fixed;
		bottom: 0;
		text-align: center;
		width: 100%;
		margin-bottom: 0.5em;
	}
</style>
