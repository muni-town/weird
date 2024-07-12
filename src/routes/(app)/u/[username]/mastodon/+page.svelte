<script lang="ts">
	import type { PageData } from './$types';
	import Pin from '$lib/icons/Pin.svelte';
	import Reply from '$lib/icons/Reply.svelte';
	import Reblog from '$lib/icons/Reblog.svelte';
	import Favorite from '$lib/icons/Favorite.svelte';
	const { data }: { data: PageData } = $props();
	const profile = data.profile;
	let search = $state(data.search);
	const mastodon_profile = data.mastodon_profile;
	let statuses: any[] = $state([]);
	let show_blogs = $state('blogs');
	let last_fetched_status_id = 0;

	const fetchStatuses = (reblog_flag: string, fetch_from_id?: any) => {
		const fetch_from_tag = fetch_from_id ? `&max_id=${fetch_from_id}` : '';
		fetch(
			`https://${mastodon_profile.mastodon_server}/api/v1/accounts/${mastodon_profile.id}/statuses?limit=80&pinned=false${reblog_flag}${fetch_from_tag}`,
			{
				method: 'GET'
			}
		)
			.then((r) => r.json())
			.then((stt) => {
				if (!fetch_from_tag) statuses = stt;
				fetch(
					`https://${mastodon_profile.mastodon_server}/api/v1/accounts/${mastodon_profile.id}/statuses?limit=5&pinned=true${reblog_flag}${fetch_from_tag}`,
					{
						method: 'GET'
					}
				)
					.then((r) => r.json())
					.then((pinned_statuses) => {
						const extend_from = fetch_from_tag
							? statuses
							: pinned_statuses.map((s: any) => ({ ...s, pinned: true }));
						statuses = [...extend_from, ...stt];
						last_fetched_status_id = statuses[statuses.length - 1].id;
					});
			});
	};
	$effect(() => {
		let reblog_flag = '';
		switch (show_blogs) {
			case 'blogs':
				reblog_flag = '&exclude_reblogs=true';
				break;
		}
		if (search && profile.mastodon_access_token) {
			fetch(
				`https://${mastodon_profile.mastodon_server}/api/v2/search?q=${search}&resolve=true&type=statuses&limit=40&account_id=${mastodon_profile.id}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${profile.mastodon_access_token}`
					}
				}
			)
				.then((r) => r.json())
				.then((stt) => {
					console.log(stt);
					statuses = stt.statuses;
				});
		} else fetchStatuses(reblog_flag);
	});

	const fetchMore = () => {
		let reblog_flag = '';
		switch (show_blogs) {
			case 'blogs':
				reblog_flag = '&exclude_reblogs=true';
				break;
		}
		fetchStatuses(reblog_flag, last_fetched_status_id);
	};

	const parseLink = (text: string) => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/html');
		const a = doc.querySelector('a');
		if (a) return a.getAttribute('href');
		return '';
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
			<span class="mastodon block p-6 text-sm md:text-base lg:text-lg"
				>{@html mastodon_profile.description}</span
			>
			<div class="justify-start md:flex md:flex-wrap md:items-center">
				{#each mastodon_profile.fields as field}
					<a
						href={parseLink(field.value)}
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
		<div class="m-2">
			<select
				class="form-select w-44 border border-gray-300 px-2 py-1 dark:bg-gray-800"
				bind:value={show_blogs}
			>
				<option value="blogs">Blogs</option>
				<option value="all">All</option>
			</select>
			<input
				type="text"
				class="form-input w-44 border border-gray-300 px-2 py-1 dark:bg-gray-800"
				placeholder="Search"
				bind:value={search}
			/>
		</div>
		<div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4">
			{#each statuses as status}
				<div class="w-full p-2 no-underline">
					<div
						class="border-gray-00 flex h-full flex-col items-start overflow-hidden rounded-lg border-2 border-opacity-60"
					>
						<div class="w-full flex-shrink-0">
							<div class="items-center gap-2 p-2 px-5">
								{#if status.pinned}
									<div class="pb-2">
										<Pin />
										<span class="my-0 mb-1 inline-block text-xs text-gray-500">Pinned</span>
									</div>
								{/if}
								{#if show_blogs && status.reblog}
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
												alt="User avatar"
												class="absolute left-5 top-5 h-6 w-6 rounded-full"
											/>
										</div>
										<div class="ml-3">
											<span class="text-md block">{status.reblog.account.display_name}</span>
											<span class="text-xs text-gray-500">{status.reblog.account.acct}</span>
										</div>
									</div>
									<p class="mastodon">{@html status.reblog.content}</p>
								{/if}
								{#if status.content.length > 0}
									<div class="flex">
										<img
											src={status.account.avatar}
											alt="User avatar"
											class="h-10 w-10 rounded-md"
										/>
										<div class="ml-3">
											<span class="text-md block">{status.account.display_name}</span>
											<span class="text-xs text-gray-500">{status.account.acct}</span>
										</div>
									</div>
									<p class="mastodon">{@html status.content}</p>
								{/if}
								<div class="mastodon py-1">
									{#if status.media_attachments.length > 0}
										{#each status.media_attachments as media}
											{#if media.type == 'image'}
												<img src={media.preview_url} alt={media.description} class="w-full" />
											{:else if media.type == 'video'}
												<video src={media.url} controls class="w-full"></video>
											{:else if media.type == 'gifv'}
												<video src={media.url} autoplay loop class="w-full"></video>
											{/if}
										{/each}
									{/if}
								</div>

								<div class="columns-3 gap-2">
									<div>
										<Reply />
										<span class="pl-1 pt-3 text-gray-500">{status.replies_count}</span>
									</div>
									<div>
										<Reblog />
										<span class="pl-1 pt-3 text-gray-500">{status.reblogs_count}</span>
									</div>
									<div>
										<Favorite />
										<span class="pl-1 pt-3 text-gray-500">{status.favourites_count}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<button class="w-full p-2 no-underline" on:click={fetchMore}>
			<div
				class="border-gray-00 flex h-full flex-col items-start overflow-hidden rounded-lg border-2 border-opacity-60"
			>
				<div class="w-full flex-shrink-0">
					<div class="items-center gap-2 p-2 px-5">
						<div class="flex justify-center">
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-gray-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
								<span class="text-gray-500">Load more</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</button>
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

<style>
	.mastodon :global(a) {
		color: #1e85c3;
	}
	.mastodon :global(a:hover) {
		text-decoration: underline;
	}
	.mastodon :global(p) {
		margin: 0.5rem 0;
	}
	.mastodon :global(.invisible) {
		visibility: hidden;
		display: none;
	}

	.mastodon :global(.ellipsis::after) {
		content: '...';
		display: inline-block;
		width: 1em;
		overflow: hidden;
		vertical-align: bottom;
		animation: ellipsis 1s infinite steps(4, end);
	}

	.mastodon :global(ul),
	.mastodon :global(ol) {
		padding-left: 1.5em;
		list-style: circle;
	}

	.mastodon :global(.hashtag) {
		-webkit-text-size-adjust: 100%;
		tab-size: 4;
		font-feature-settings: normal;
		font-variation-settings: normal;
		-webkit-tap-highlight-color: rgba(128, 128, 128, 0.5);
		scrollbar-color: rgba(128, 128, 128, 0.5) rgba(0, 0, 0, 0.1);
		font-size: 1rem;
		line-height: 1.5rem;
		font-family: var(--theme-font-family-base);
		box-sizing: border-box;
		border-width: 0;
		border-style: solid;
		border-color: #e5e7eb;
		color: inherit;
		text-decoration: inherit;
		display: inline-block;
		--tw-bg-opacity: 1;
		/* background-color: rgb(255 255 255 / var(--tw-bg-opacity)); */
		padding-left: 0.75rem;
		padding-right: 0.75rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
		--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
		box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
			var(--tw-shadow);
		margin-left: 0.25rem;
		margin-right: 0.25rem;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
		border-radius: 0.75rem;
	}

	.mastodon :global(blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin-left: 0;
	}

	:global(svg) {
		width: 1em;
		display: inline-block;
	}
</style>
