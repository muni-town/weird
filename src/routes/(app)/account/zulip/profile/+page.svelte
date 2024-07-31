<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { formatDistance } from 'date-fns';

	export let data;
	const messages = data.messages ?? [];
</script>

<div class="mx-auto max-w-md py-12">
	<div class="grid grid-cols-1 gap-4">
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
