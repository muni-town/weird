<script lang="ts">
	import { getModalStore, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import type { UserInfo } from '$lib/rauthy';
	import type { Provider } from '$lib/rauthy/client';
	import getPkce from 'oauth-pkce';
	import { checkResponse } from '$lib/utils/http';

	const modalStore = getModalStore();

	let userInfo = $state({}) as UserInfo | undefined;
	let providers = $state([]) as Provider[];
	let atprotoDid = $state(undefined) as undefined | string;
	$effect(() => {
		userInfo = ($modalStore[0] as any).userInfo;
		providers = ($modalStore[0] as any).providers;
		atprotoDid = ($modalStore[0] as any).atprotoDid;
	});

	$effect(() => {
		if (atprotoDid?.startsWith('did=')) {
			atprotoDid = atprotoDid.split('did=')[1];
		}
	});

	let tabSet = $state(0);
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
			headers: [['x-csrf-token', localStorage.getItem('csrfToken')!]],
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
			headers: [['x-csrf-token', localStorage.getItem('csrfToken')!]]
		});
		window.location.reload();
	}

	async function setAtprotoDid() {
		await fetch(`/undefined/settings/setAtprotoDid`, { method: 'post', body: atprotoDid });
		window.location.reload();
	}
</script>

{#if $modalStore[0]}
	<div class="manage-account-modal card flex h-[30em] w-[40em] flex-col p-4 shadow-xl">
		<header class="mb-2 text-2xl font-bold">Manage Account</header>

		<TabGroup class="flex grow flex-col" regionPanel="h-full">
			<Tab bind:group={tabSet} name="tab1" value={0}>
				<span>Login Method</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab2" value={1}>AtProto</Tab>
			<!-- Tab Panels --->
			<svelte:fragment slot="panel">
				<div class="flex h-full grow flex-col items-start">
					{#if tabSet === 0}
						<section class="flex w-full justify-center p-2">
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

						<div class="grow"></div>

						<button class="variant-ghost btn" onclick={() => modalStore.close()}> Cancel </button>
					{:else if tabSet === 1}
						<label class="w-full">
							AtProto DID:
							<input class="input w-full" placeholder="DID not set" bind:value={atprotoDid} />
						</label>
						<p class="text-md p-2 text-surface-100">
							Setting your AtProto DID will allow you to use your Weird handle as your AtProto
							handle!
						</p>
						<p class="text-md p-2 text-surface-100">
							Your DID will look something like <code
								class="rounded-sm bg-surface-200 p-1
							text-surface-800">did:plc:yG5vIOPq9MOhDgYB9Xo</code
							> and can be found in the "I have a custom domain" section of the BlueSky set handle dialog.
						</p>
						<p class="text-md p-2 text-surface-100">
							Open that dialog, copy your DID, save it here, and then Bluesky will let you set your
							weird handle as your Bluesky handle.
						</p>

						<div class="grow"></div>

						<div class="flex w-full">
							<span class="grow"></span>
							<button class="variant-ghost btn" onclick={() => setAtprotoDid()}>Save</button>
						</div>
					{/if}
				</div>
			</svelte:fragment>
		</TabGroup>
	</div>
{/if}

<style>
	:global(.manage-account-modal *:focus) {
		outline: none !important;
	}
</style>
