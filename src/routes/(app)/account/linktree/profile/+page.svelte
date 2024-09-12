<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import Icon from '@iconify/svelte';
	import { LINKTREE_ICONS_MAP } from '$lib/constants.js';
	export let data;
</script>

<div class="mx-auto max-w-xl py-12">
	<!-- account section  -->
	<section class="flex flex-col items-center gap-8">
		<Avatar
			initials={data.account.username.slice(2)}
			src={data.account.profilePictureUrl ?? ''}
			background="bg-primary-500"
			width="w-32"
			rounded="rounded-full"
		/>
		<div class="flex flex-col items-center gap-2">
			<h2 class="text-xl font-medium">@{data.account.username}</h2>
			<p class="text-center">
				{data.account.description}
			</p>
		</div>
		<div class="flex items-center gap-4">
			{#each data.account.socialLinks as link (link.type)}
				<a href={link.url} target="_blank" class="transition duration-300 hover:scale-110">
					<Icon icon={LINKTREE_ICONS_MAP[link.type]} class="h-8 w-8" />
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<div class="flex flex-col items-center gap-4">
			{#each data.account.links as link (link.id)}
				{#if link.type === 'HEADER'}
					<h2 class="mt-4 text-lg font-bold">{link.title}</h2>
				{/if}
				{#if link.type === 'CLASSIC' || link.type === 'EXTENSION'}
					<a
						target="_blank"
						href={link.url}
						class="relative w-full rounded-full border-2 border-white px-2 py-4 text-center font-medium transition duration-300 hover:bg-white hover:text-black"
					>
						{#if link.modifiers?.thumbnailUrl}
							<div class="absolute left-2 top-2">
								<Avatar rounded="rounded-full" width="w-10" src={link.modifiers.thumbnailUrl} />
							</div>
						{/if}
						{link.title}
					</a>
				{/if}

				{#if link.type === 'YOUTUBE_VIDEO'}
					<a href={link.url} class={`relative mt-4 h-60 w-full overflow-hidden rounded-lg`}>
						<img
							src={link.modifiers?.thumbnailUrl}
							class=" aspect-video h-auto w-full rounded-lg"
							alt={link.title}
						/>
						<div class="absolute bottom-0 left-0 right-0 h-16 bg-gray-900/60"></div>
						<div class="absolute bottom-4 left-2 right-2 text-center">
							{link.title}
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</section>
</div>
