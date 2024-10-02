<script lang="ts">
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/avatar/view.svelte';
	import MainContent from '$lib/components/theme/MainContent.svelte';
	import SearchInput from '$lib/components/theme/SearchInput.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { parseUsername } from '$lib/utils/username';
	import type { SvelteComponent } from 'svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const profiles = data.profiles;
	let search = $state(data.search || '');

	let filtered_profiles = $derived.by(() => {
		const words = search.split(' ');
		return profiles
			.filter((x: Profile) => {
				if (!x.username) return false;
				if (search == '') return true;
				for (const word of words) {
					const wordLowercase = word.toLowerCase();
					for (const field of [x.username, ...(x.tags || [])]) {
						const fieldLowercase = field?.toLowerCase();
						if (wordLowercase && fieldLowercase && fieldLowercase.includes(wordLowercase)) {
							return true;
						}
					}
				}
				return false;
			})
			.map((profile: Profile) => {
				// Remove the domain for local usernames
				const parsedUsername = profile.username && parseUsername(profile.username);
				const username =
					parsedUsername && parsedUsername.domain == env.PUBLIC_DOMAIN
						? parsedUsername.name
						: profile.username;
				return { ...profile, username };
			});
	});

	let searchbox: SvelteComponent;
</script>

<svelte:head>
	<title>{env.PUBLIC_MEMBERS_TITLE} | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<MainContent>
	<h1 class="mt-8 text-4xl font-bold">{env.PUBLIC_MEMBERS_TITLE}</h1>

	<SearchInput bind:this={searchbox} bind:search />

	<div class="mt-10 flex max-w-full flex-row flex-wrap justify-center gap-5 px-5">
		{#each filtered_profiles as profile (profile.username)}
			<div
				class="w-120 card relative flex flex-col items-center p-5 transition-transform duration-200 hover:scale-105"
			>
				<div class="flex w-[15em] flex-col items-center text-center">
					<div class="mb-3 flex flex-col flex-wrap items-center gap-4">
						<Avatar width="w-[5em]" username={`${profile.username}@${env.PUBLIC_DOMAIN}`} />
						<h2 class="text-2xl font-semibold">
							<a href={`/${profile.username}`} class="card-link">
								{profile.display_name || profile.username}
							</a>
						</h2>
					</div>

					<div class="flex max-w-full flex-col gap-4">
						{#if profile.tags && profile.tags.length > 0}
							<div class="flex max-w-full flex-wrap items-center justify-center gap-2">
								{#each profile.tags as tag}<button
										type="button"
										class="text-surface-900-50-token btn relative rounded-md bg-surface-200 p-1 hover:bg-surface-400 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-700"
										onclick={(e) => {
											e.preventDefault();
											search = tag;
											searchbox.focus();
										}}
									>
										{tag}
									</button>{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</MainContent>

<style>
	.card-link::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
	}
</style>
