<script lang="ts">
	import { env } from '$env/dynamic/public';
	import MainContent from '$lib/components/theme/MainContent.svelte';
	import SearchInput from '$lib/components/theme/SearchInput.svelte';
	import type { SvelteComponent } from 'svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { Avatar } from '@skeletonlabs/skeleton';

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
				const username = profile.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0];
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

<MainContent>
	<h1 class="mt-8 text-4xl font-bold">{env.PUBLIC_MEMBERS_TITLE}</h1>

	<SearchInput bind:this={searchbox} bind:search autofocus />

	<div class="mt-10 flex max-w-full flex-row flex-wrap justify-center gap-5 px-5">
		{#each filtered_profiles as profile (profile.username)}
			<div
				class="w-120 card relative flex flex-col items-center rounded-lg !bg-surface-700 p-5 transition-transform duration-200 hover:scale-105"
			>
				<div class="flex w-[15em] flex-col items-center text-center">
					<div class="mb-3 flex flex-col flex-wrap items-center gap-7">
						<Avatar width="w-[8em]" src={`/${profile.username}/avatar`} />
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
										class="border-surface-500-400-token btn relative rounded-full border-[1px] bg-surface-900 p-1 px-3 text-surface-100 hover:bg-surface-700"
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
