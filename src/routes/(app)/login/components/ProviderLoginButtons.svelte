<script lang="ts">
	import type { PageData } from '../$types';

	interface props {
		providers: PageData['providers'];
		providerLogin: (id: string) => void;
	}

	const { providers, providerLogin }: props = $props();
</script>

{#if providers && providers.length > 0}
	<div class="flex w-full flex-col items-center">
		<div>Or Login With</div>
		<div class="providers mt-2 flex flex-col gap-2">
			{#each providers as provider}
				<button
					class="variant-outline btn w-full"
					onclick={(e) => {
						e.preventDefault();
						providerLogin(provider.id);
					}}
				>
					<div class="flex flex-row items-center gap-3">
						<span class="providerName">{provider.name}</span>
						<img
							src={`/auth/v1/providers/${provider.id}/img`}
							alt={provider.name}
							style="width: 20px; height: 20px;"
						/>
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}
