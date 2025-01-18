<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { UserInfo } from '$lib/rauthy';
	import type { Provider } from '$lib/rauthy/client';
	import getPkce from 'oauth-pkce';
	import { checkResponse } from '$lib/utils/http';

	const modalStore = getModalStore();

	let userInfo = $state({}) as UserInfo | undefined;
	let providers = $state([]) as Provider[];
	$effect(() => {
		userInfo = ($modalStore[0] as any).userInfo;
		providers = ($modalStore[0] as any).providers;
	});

	let federated = $derived(userInfo?.account_type?.startsWith('federated') || false);
	let currentProviderName = $derived(
		providers.find((x) => x.id == userInfo?.auth_provider_id)?.name
	);

	async function providerLinkPkce(provider_id: string, pkce_challenge: string) {
		const data = {
			pkce_challenge,
			redirect_uri: window.location.href,
			client_id: 'rauthy',
			email: userInfo?.email,
			provider_id
		};
		const resp = await fetch(`/auth/v1/providers/${provider_id}/link`, {
			method: 'POST',
			headers: [['csrf-token', localStorage.getItem('csrfToken')!]],
			body: JSON.stringify(data)
		});
		await checkResponse(resp);
		const providerToken = await resp.text();
		localStorage.setItem('providerToken', providerToken);
		window.location.href = resp.headers.get('location')!;
	}
	async function linkAccount(providerId: string) {
		getPkce(64, (error, { challenge, verifier }) => {
			if (!error) {
				localStorage.setItem('pkceVerifierUpstream', verifier);
				providerLinkPkce(providerId, challenge);
			}
		});
	}

	async function unlinkAccount() {
		await fetch(`/auth/v1/providers/link`, {
			method: 'delete',
			headers: [['csrf-token', localStorage.getItem('csrfToken')!]]
		});
		window.location.reload();
	}
</script>

{#if $modalStore[0]}
	<div class="card flex flex-col justify-between p-4 shadow-xl">
		<div>
			<header class="text-2xl font-bold">Manage Account</header>

			<section class="p-2">
				<div class="my-4 flex flex-col gap-2">
					{#if federated}
						<button class="variant-outline btn" onclick={unlinkAccount}>
							Disconnect From {currentProviderName}
						</button>
					{:else if providers.length > 0}
						{#each providers as provider}
							<button class="variant-outline btn" onclick={() => linkAccount(provider.id)}>
								<span>
									<img
										src={`/auth/v1/providers/${provider.id}/img`}
										alt=""
										width="20"
										height="20"
									/>
								</span>
								<span>
									Connect To {provider.name}
								</span>
							</button>
						{/each}
					{/if}
				</div>
			</section>
		</div>

		<button class="variant-ghost btn" onclick={() => modalStore.close()}> Cancel </button>
	</div>
{/if}
