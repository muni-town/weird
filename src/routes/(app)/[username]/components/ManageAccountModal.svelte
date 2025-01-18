<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { UserInfo } from '$lib/rauthy';
	import type { Provider } from '$lib/rauthy/client';
	import getPkce from 'oauth-pkce';

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

	const getKey = (i: number) => {
		let res = '';

		const target = i || 8;
		for (let i = 0; i < target; i += 1) {
			let nextNumber = 60;
			while ((nextNumber > 57 && nextNumber < 65) || (nextNumber > 90 && nextNumber < 97)) {
				nextNumber = Math.floor(Math.random() * 74) + 48;
			}
			res = res.concat(String.fromCharCode(nextNumber));
		}

		return res;
	};
	async function providerLinkPkce(provider_id: string, pkce_challenge: string) {
		const data = {
			pkce_challenge,
			redirect_uri: window.location.href,
			client_id: 'rauthy',
			email: userInfo?.email,
			provider_id
		};
		await fetch(`/auth/v1/providers/${provider_id}/link`, {
			method: 'POST',
			headers: [['csrf-token', localStorage.getItem('csrfToken')!]],
			body: JSON.stringify(data)
		})
			.then(() => {
				getPkce(64, async (error, { challenge, verifier }) => {
					if (!error) {
						localStorage.setItem('pkce_verifier', verifier);
						const nonce = getKey(24);
						const s = 'account';
						const redirect_uri = encodeURIComponent(
							`${window.location.origin}/auth/v1/oidc/callback`
						);
						window.location.href = `/auth/v1/oidc/logout?post_logout_redirect_uri=%2Fauth%2Fv1%2Foidc%2Fauthorize%3Fclient_id%3Drauthy%26redirect_uri%3D${redirect_uri}%26response_type%3Dcode%26code_challenge%3D${challenge}%26code_challenge_method%3DS256%26scope%3Dopenid%2Bprofile%2Bemail%26nonce%3D${nonce}%26state%3D${s}`;
					}
				});
			})
			.catch((err) => console.log(err, 'a'));
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
