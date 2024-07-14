<script lang="ts">
	import Repository from '$lib/components/git/Repository.svelte';
	import UserInfoItem from '$lib/components/git/UserInfoItem.svelte';
	import CompanyIcon from '$lib/icons/CompanyIcon.svelte';
	import MapPinIcon from '$lib/icons/MapPinIcon.svelte';
	import LinkIcon from '$lib/icons/LinkIcon.svelte';
	import TwitterIcon from '$lib/icons/TwitterIcon.svelte';
	import LanguageTag from '$lib/components/git/LanguageTag.svelte';

	export let data;
	const user = data.user;
</script>

<div class="container mx-auto flex flex-col gap-8 px-4 py-8 md:px-0">
	<section>
		<div>
			<img src={user.avatar_url} alt={user.name} class={`aspect-square h-64 w-64 rounded-full`} />

			<div class={`mt-4`}>
				<h2 class={`text-2xl font-bold`}>{user.name}</h2>
				<h2 class={`text-xl text-gray-700 dark:text-gray-400`}>{user.login}</h2>
			</div>
			<p class={`mt-4 max-w-md text-gray-600 dark:text-gray-300`}>{user.bio}</p>

			<div class={`mt-4 flex items-center space-x-2`}>
				<a href={`/${user.login}/followers`} class={`flex items-center space-x-1 hover:underline`}>
					<p class={`font-bold`}>{user.followers}</p>
					<p class={`text-sm text-gray-600 dark:text-gray-300`}>
						{user.followers > 1 ? 'followers' : 'follower'}
					</p>
				</a>
				<span>&bull;</span>
				<a href={`/${user.login}/following`} class={`flex items-center space-x-1 hover:underline`}>
					<p class={`font-bold`}>{user.following}</p>
					<p class={`text-sm text-gray-600 dark:text-gray-300`}>
						{user.following > 1 ? 'followings' : 'following'}
					</p>
				</a>
			</div>

			<div class={`mt-4 flex flex-col space-y-2`}>
				{#if user.company}
					<UserInfoItem label={user.company}>
						<CompanyIcon />
					</UserInfoItem>
				{/if}
				{#if user.location}
					<UserInfoItem label={user.location}>
						<MapPinIcon />
					</UserInfoItem>
				{/if}

				{#if user.blog}
					<UserInfoItem href={user.blog} label={user.blog}>
						<LinkIcon />
					</UserInfoItem>
				{/if}
				{#if user.twitter_username}
					<UserInfoItem
						href={`https://twitter.com/${user.twitter_username}`}
						label={`@${user.twitter_username}`}
					>
						<TwitterIcon />
					</UserInfoItem>
				{/if}
			</div>
		</div>
	</section>

	<section>
		<h3 class="text-xl font-semibold">Languages</h3>
		<div class="mt-4 flex flex-wrap gap-4">
			{#each data?.languages as lang}
				<LanguageTag language={lang} />
			{/each}
		</div>
	</section>

	<section>
		<h3 class="text-xl font-medium">Repositories</h3>
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each data.repos as repo}
				<Repository {repo} />
			{/each}
		</div>
	</section>
</div>
