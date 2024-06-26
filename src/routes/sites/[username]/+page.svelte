<script lang="ts">
	let layout = false;
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { WorkCapacity, WorkCompensation } from '../../auth/v1/account/proxy+page.server';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	const profile = data.profile;
	const mastodon_profile = data.mastodon_profile;

	const printWorkCapacity = (c: WorkCapacity): string => {
		if (c == 'full_time') {
			return 'Full Time';
		} else if (c == 'part_time') {
			return 'Part Time';
		} else {
			return 'Not Specified';
		}
	};
	const printWorkCompensation = (c: WorkCompensation): string => {
		if (c == 'paid') {
			return 'Paid';
		} else if (c == 'volunteer') {
			return 'Volunteer';
		} else {
			return 'Not Specified';
		}
	};
</script>

<svelte:head>
	<title>
		{mastodon_profile?.display_name || mastodon_profile.username}'s Weird Side'
	</title>
</svelte:head>

{#if !('error' in profile)}
	{#if !mastodon_profile.header.includes('missing.png')}
		<section
			class="bg-cover bg-center py-20"
			style="background-image: url({mastodon_profile.header});"
		>
			<div class="container mx-auto text-center">
				<h1 class="text-4xl font-bold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
					{mastodon_profile.display_name}
				</h1>
			</div>
		</section>
	{/if}

	<section class="py-12">
		<div class="container mx-auto max-w-[500px]">
			<div class="flex items-center justify-center">
				<!-- Profile Image -->
				<div class="flex-none">
					<img
						src={mastodon_profile.avatar}
						alt="Profile Picture"
						class="h-24 w-24 rounded-full md:h-32 md:w-32"
					/>
				</div>
				<!-- Profile Info -->
				<div class="ml-4 flex-grow text-sm md:ml-8 md:text-lg">
					<h2 class="text-2xl font-bold">{mastodon_profile.display_name}</h2>
					<a href={mastodon_profile.uri} class="text-gray-600 no-underline hover:underline"
						>@{mastodon_profile.username}@{mastodon_profile.mastodon_server}</a
					>
					<div class="mt-4">
						<div class="flex items-center">
							<p class="mr-2 text-center md:mr-2">
								<span class="font-bold">{mastodon_profile.statuses_count}</span> Posts
							</p>
							<p class="mr-2 text-center md:mr-2">
								<span class="font-bold">{mastodon_profile.followers_count}</span> Followers
							</p>
							<p class="text-center">
								<span class="font-bold">{mastodon_profile.following_count}</span> Following
							</p>
						</div>
					</div>
				</div>
			</div>
			<span class="block p-6 text-sm md:text-base lg:text-lg"
				>{@html mastodon_profile.description}</span
			>
			<div class="justify-start md:flex md:flex-wrap md:items-center">
				{#each mastodon_profile.fields as field}
					<a
						href={field.value}
						class="y-2 mx-3 my-2 block rounded bg-white px-3 py-1 shadow hover:bg-gray-50 dark:bg-slate-800 md:mx-1 md:my-1 md:rounded-xl"
						target="_blank"
						rel="noopener noreferrer"
					>
						{field.name}
					</a>
				{/each}
			</div>
		</div>
	</section>
	<div class="container mx-auto p-4">
		<div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4">
			{#each mastodon_profile.statuses as status}
				<span class="w-full p-2 no-underline">
					<div
						class="border-gray-00 flex h-full flex-col items-start overflow-hidden rounded-lg border-2 border-opacity-60"
					>
						<div class="w-full flex-shrink-0">
							{#if status.reblog}
								<div class="items-center gap-2 p-2">
									<p class="mb-2 text-xs text-gray-500">Quoted from</p>
									<div class="flex">
										<div class="relative">
											<img
												src={status.reblog.account.avatar}
												alt="Reblogged by"
												class="h-10 w-10 rounded-md"
											/>
											<img
												src={status.account.avatar}
												alt="Reblogged by"
												class="absolute left-5 top-5 h-6 w-6 rounded-full"
											/>
										</div>
										<div class="ml-3">
											<span class="text-md block">{status.reblog.account.display_name}</span>
											<span class="text-xs text-gray-500">{status.reblog.account.acct}</span>
										</div>
									</div>
									<p>{@html status.reblog.content}</p>
								</div>
							{/if}
							{#if status.content.length > 0}
								<div class="items-center gap-2 p-2">
									<div class="flex">
										<img
											src={status.account.avatar}
											alt="Reblogged by"
											class="h-10 w-10 rounded-md"
										/>
										<div class="ml-3">
											<span class="text-md block">{status.account.display_name}</span>
											<span class="text-xs text-gray-500">{status.account.acct}</span>
										</div>
									</div>
									<p>{@html status.content}</p>
								</div>
							{/if}
						</div>
						<div class="flex-grow p-4">
							<h2 class="text-xl font-medium">{status.title}</h2>
							<p class="text-base">{status.description}</p>
						</div>
					</div>
				</span>
			{/each}
		</div>
	</div>
{:else}
	<main class="flex flex-col items-center">
		<aside class="alert variant-ghost-error mt-8 w-80">
			<div class="alert-message">
				<p>Error loading user: {profile.error}</p>
			</div>
		</aside>
	</main>
{/if}
