<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { formatDistance } from 'date-fns';

	export let data;
	const messages = data.messages ?? [];
	const subscriptions = data.subscriptions ?? [];
</script>

<div class="container mx-auto py-12">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
		{#each subscriptions as s (s.stream_id)}
			<article class="card">
				<h4 class="card-header font-bold">{s.name}</h4>
				<div class="card-footer mt-4 flex justify-between">
					<div>
						{#if s.is_muted}
							<svg
								data-slot="icon"
								fill="none"
								stroke-width="1.5"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
								class="h-5 w-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
								></path>
							</svg>
						{:else}
							<svg
								data-slot="icon"
								fill="none"
								stroke-width="1.5"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
								class="h-5 w-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
								></path>
							</svg>
						{/if}
					</div>
					<time datetime={new Date(s.date_created).toDateString()} class="text-sm">
						{new Date(s.date_created * 1000).toDateString()}
					</time>
				</div>
			</article>
		{/each}
	</div>
	<div class="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4">
		{#each messages as message (message.id)}
			<div class="grid grid-cols-[auto_1fr] gap-2">
				<Avatar initials={message.sender_full_name} src={message?.avatar_url ?? ''} width="w-12" />
				<div class="card variant-soft space-y-2 rounded-tl-none p-4">
					<header class="flex justify-between">
						<div>
							<p class="font-bold">{message.sender_full_name}</p>
							<span class="text-sm opacity-50">{message.sender_email}</span>
						</div>
						<small class="opacity-50">
							{formatDistance(new Date(message.timestamp * 1000), new Date(), { addSuffix: true })}
						</small>
					</header>
					<p>
						{@html message.content}
					</p>
					<div class="flex justify-end">
						<span class="variant-filled badge">{message.display_recipient}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
