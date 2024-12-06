<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const modalStore = getModalStore();
	let username = $state('');

	async function deleteProfile() {
		await fetch(`/${$page.params.username}/settings/deleteProfile`, {
			method: 'post'
		});
		await goto('/claim-username', { invalidateAll: true, replaceState: true });
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div class="card flex flex-col justify-between space-y-4 p-4 shadow-xl">
		<div>
			<header class="text-2xl font-bold">Delete Profile Data</header>

			<section class="p-2">
				<div class="prose prose-invert">
					<p>Are you sure that you want to delete all of your profile data permanently?</p>
					<p>Type your full username to confirm deletion.</p>
				</div>

				<div class="my-2 flex flex-col gap-2">
					<input class="input" bind:value={username} placeholder={$page.params.username} />

					<button
						class="variant-ghost-error btn"
						disabled={username != $page.params.username}
						onclick={deleteProfile}
					>
						Delete
					</button>
				</div>
			</section>
		</div>

		<button class="variant-ghost btn" onclick={() => modalStore.close()}> Cancel </button>
	</div>
{/if}
