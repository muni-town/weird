<script lang="ts">
	import type { Profile } from '../../routes/(app)/auth/v1/account/proxy+page.server';
	import { env } from '$env/dynamic/public';
	export let profile: Profile;

	const avatar = `/u/${profile.username}/avatar`;
	const fallbackAvatar = `${env.PUBLIC_DICEBEAR_URL}/8.x/${env.PUBLIC_DICEBEAR_STYLE}/svg?seed=${profile.username}`;

	type WorkCapacity = 'full_time' | 'part_time' | 'not_specified';
	type WorkCompensation = 'paid' | 'volunteer' | 'not_specified';
	const printWorkCapacity = (c?: WorkCapacity): string => {
		if (c == 'full_time') {
			return 'Full Time';
		} else if (c == 'part_time') {
			return 'Part Time';
		} else {
			return 'Not Specified';
		}
	};
	const printWorkCompensation = (c?: WorkCompensation): string => {
		if (c == 'paid') {
			return 'Paid';
		} else if (c == 'volunteer') {
			return 'Volunteer';
		} else {
			return 'Not Specified';
		}
	};
	const ShortDescription = () => {
		return [
			profile.username,
			printWorkCapacity(profile.work_capacity),
			printWorkCompensation(profile.work_compensation),
			profile.location
		]
			.filter(Boolean)
			.join(' • ');
	};
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/pico.css/dist/pico.min.css" />
</svelte:head>

{#if profile}
	<main class="container">
		<img
			src={avatar}
			width="200px"
			alt="Avatar"
			onerror={(ev: Event) => {
				console.log('Image error!!!');
				(ev.target as HTMLImageElement).src = fallbackAvatar;
			}}
		/>
		<h1 style="margin-top: 1em;">{profile.display_name}</h1>
		<span>{ShortDescription()}</span>

		<div class="links">
			<a href={`${env.PUBLIC_URL}/u/${profile.username}`}>Weird</a>
			{#if profile.links}
				{#each profile.links as link}
					<a href={link.url}>
						{link.label || link.url}
					</a>
				{/each}
			{/if}
		</div>

		{#if profile.bio}
			<p style="max-width: 800px; text-align:justify;">
				{profile.bio}
			</p>
		{/if}

		{#if profile.tags && profile.tags.length > 0}
			<div>
				<span class="tags">
					{#each profile.tags as tag}
						<a href={`${env.PUBLIC_URL}/members?q=${tag}`} target="_blank">
							#{tag}
						</a>
					{/each}
				</span>
			</div>
		{/if}
	</main>
{/if}

<style>
	main {
		margin-top: 1em;
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
		display: flex;
	}
	.links a {
		margin: 0.5em;
	}
</style>
