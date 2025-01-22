<script lang="ts">
	import { env } from '$env/dynamic/public';
	import SearchInput from '$lib/components/theme/SearchInput.svelte';
	import type { SvelteComponent } from 'svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { usernames } from '$lib/usernames/client';

	// Use seeded random generator so that SSR has same result as CSR hydration.
	//
	// https://decode.sh/seeded-random-number-generator-in-js/
	function random(seed: number) {
		var m = 2 ** 35 - 31;
		var a = 185852;
		var s = seed % m;
		let rng = function () {
			const n = (s = (s * a) % m) / m;
			return n;
		};
		// For some reason the first call is predictably lower than everything else so call it once
		rng();
		return rng;
	}

	const { data }: { data: PageData } = $props();
	let search = $state('');
	let rng = $derived(random(data.randomSeed));
	let profiles = $derived(data.profiles);

	let filtered_profiles = $derived.by(() => {
		rng();
		const words = search.split(' ');
		const p = profiles
			.filter((x) => {
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
			.map((profile) => {
				// Remove the domain for local usernames
				const username = usernames.shortNameOrDomain(profile.username);
				return { ...profile, username };
			})
			.map((x) => ({ sort: rng(), ...x }));
		p.sort((a, b) => {
			return a.sort - b.sort;
		});
		return p;
	});

	let searchbox: SvelteComponent;

	$effect(() => {
		search = decodeURIComponent($page.url.hash.slice(1));
	});
	$effect(() => {
		window.location.hash = `#${search}`;
	});
</script>

<svelte:head>
	<title>{env.PUBLIC_MEMBERS_TITLE} | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col gap-8 px-8 py-16 font-spacemono">
	<div class="flex flex-col gap-3">
		<h1 class="pl-1 font-rubik text-4xl">{env.PUBLIC_MEMBERS_TITLE}</h1>
		<SearchInput bind:this={searchbox} bind:search autofocus />
	</div>

	<div class="flex flex-row flex-wrap justify-center gap-5">
		{#each filtered_profiles as profile (profile.username)}
			<div
				class="card relative flex max-w-sm flex-col items-center rounded-lg border-2 border-surface-400 !bg-surface-50/20 px-5 py-8 transition-transform duration-200 hover:scale-105"
			>
				<div class="flex flex-col items-center gap-6 text-center max-w-full">
					<div class="flex flex-col flex-wrap items-center gap-7 max-w-full">
						<Avatar width="w-[8em]" src={`/${profile.username}/avatar`} />
						<a href={`/${profile.username}`} class="card-link flex flex-col gap-2 max-w-full">
							<h2 class="font-rubik text-2xl font-semibold break-words max-w-full">
								{profile.display_name}
							</h2>
							<h2 class="font-uncut font-semibold">
								{profile.username}
							</h2>
						</a>
					</div>

					<div class="flex w-full flex-col gap-4">
						{#if profile.tags && profile.tags.length > 0}
							<div class="flex w-full flex-wrap items-center justify-center gap-2">
								<!-- max 3 tags -->
								{#each profile.tags.slice(0, 3) as tag}
									<button
										type="button"
										class="btn relative rounded-full border-[1px] border-surface-500 bg-surface-300 p-1 px-3 text-surface-900 hover:bg-surface-200"
										onclick={(e) => {
											e.preventDefault();
											search = tag;
											searchbox.focus();
										}}
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>

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
