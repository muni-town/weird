<script lang="ts">
	import getPkce from 'oauth-pkce';
	import { getUserInfo } from '$lib/rauthy';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import { parseUsername } from '$lib/utils';
	import Avatar from '$lib/components/avatar/view.svelte';
	import type { Profile } from '$lib/leaf/profile';

	const { data }: { data: PageData } = $props();
	const profile: Profile | undefined = data.profile;
	const providers = data.providers;

	const userInfo = getUserInfo();
	const PKCE_VERIFIER = 'pkce_verifier';

	/** The username without the `@` 		*/
	const parsedUsername = (profile?.username && parseUsername(profile.username)) || undefined;

	let username = $state(parsedUsername?.name || '');
	let display_name = $state(profile?.display_name || '');
	let bio = $state(profile?.bio || '');
	let links = $state(profile?.links || []);
	let nextLink = $state({ label: '', url: '' } as { label?: string; url: string });
	let mastodon_server = $state(profile?.mastodon_profile?.server || '');
	let mastodon_username = $state(profile?.mastodon_profile?.username || '');

	let tags = $state(profile?.tags || []);
	let tagsString = $state((profile?.tags || []).join(', '));

	const publicUrl = new URL(env.PUBLIC_URL);
	const pubpageUrl =
		parsedUsername?.name &&
		(profile?.custom_domain
			? `${publicUrl.protocol}//${profile.custom_domain}`
			: `${publicUrl.protocol}//${parsedUsername.name}.${env.PUBLIC_DOMAIN}`);

	$effect(() => {
		tags = tagsString
			.split(',')
			.map((x) => x.trim())
			.filter((x) => x.length > 0);
	});

	const baseUrl = new URL($page.url);
	baseUrl.pathname = '';

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

	onMount(() => {
		if (localStorage.getItem('isLoggingIn') === 'true') {
			localStorage.removeItem('isLoggingIn');
			window.location.reload();
		} else if (!userInfo) {
			getPkce(64, (error, { challenge, verifier }) => {
				if (!error) {
					localStorage.setItem(PKCE_VERIFIER, verifier);
					const nonce = getKey(24);
					const s = 'account';
					const redirect_uri = `${window.location.origin}/auth/v1/oidc/callback`
						.replaceAll(':', '%3A')
						.replaceAll('/', '%2F');
					window.location.href = `/auth/v1/oidc/authorize?client_id=rauthy&redirect_uri=${redirect_uri}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&scope=openid+profile+email&nonce=${nonce}&state=${s}`;
				}
			});
		}
	});

	const providerLinkPkce = async (provider_id: string, pkce_challenge: string) => {
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
						localStorage.setItem(PKCE_VERIFIER, verifier);
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
	};
	const AddProvider = (provider_id: string) => {
		getPkce(64, (error, { challenge, verifier }) => {
			if (!error) {
				localStorage.setItem('pkceVerifierUpstream', verifier);
				providerLinkPkce(provider_id, challenge);
			}
		});
	};

	// const LinkWithMastodon = async (e: Event) => {
	// 	e.preventDefault();
	// 	mastodon_server = mastodon_server.startsWith('https://')
	// 		? mastodon_server
	// 		: `https://${mastodon_server}`;
	// 	mastodon_server = mastodon_server.endsWith('/')
	// 		? mastodon_server.slice(0, -1)
	// 		: mastodon_server;
	// 	fetch(mastodon_server + '/api/v1/apps', {
	// 		method: 'POST',
	// 		headers: {
	// 			'Content-Type': 'application/json'
	// 		},
	// 		body: JSON.stringify({
	// 			client_name: 'Weird Ones',
	// 			redirect_uris: window.location.origin + '/account/link-mastodon',
	// 			scopes: 'read',
	// 			website: window.location.origin
	// 		})
	// 	})
	// 		.then((response) => response.json())
	// 		.then((data) => {
	// 			let client_id = data.client_id;
	// 			let client_secret = data.client_secret;
	// 			let redirect_uri = data.redirect_uri;
	// 			localStorage.setItem(
	// 				'app_data',
	// 				JSON.stringify({ client_id, client_secret, redirect_uri, mastodon_server })
	// 			);
	// 			let redirect_url = `${mastodon_server}/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=read`;
	// 			window.location.href = redirect_url;
	// 		})
	// 		.catch((err) => console.log(err));
	// };
</script>

<svelte:head>
	<title>Profile | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

{#if userInfo}
	<main class="flex items-start justify-center gap-5 pt-12">
		<section class="card px-5 py-4">
			<h2 class="text-lg font-bold">{display_name}</h2>

			<ol class="list-nav mt-4 flex flex-col gap-2">
				<li>
					<a href="/auth/v1/account" class="variant-outline"> Profile </a>
				</li>
				<li>
					<a href={`/account/${userInfo.id}/custom-domain`}> Site Generation </a>
				</li>
			</ol>
		</section>

		<form
			method="post"
			action="/account/update"
			enctype="multipart/form-data"
			class="card flex w-[600px] max-w-[90%] flex-col gap-4 p-8 text-xl"
		>
			<div class="mb-4 flex items-center gap-3">
				<Avatar user_id={userInfo.id} username={`${username}@${env.PUBLIC_DOMAIN}`} width="w-32" />
				<div>
					<h1 class="my-3 text-4xl">Edit Profile</h1>
					<div class="text-surface-300">{userInfo.email}</div>
				</div>
			</div>

			<div class="mb-4">
				<div>
					<strong class="pr-2">Public Profile:</strong>
					<span class="text-base">
						{#if parsedUsername}
							<a class="underline" href={`${baseUrl}u/${parsedUsername.name}`}>
								{`${baseUrl}u/${parsedUsername.name}`}
							</a>
						{:else}<span class="text-surface-400">Username Not Set</span>{/if}
					</span>
				</div>
				<div>
					<strong class="pr-2">Personal Webpage:</strong>
					<span class="text-base">
						{#if pubpageUrl}
							<a class="underline" href={pubpageUrl}>
								{pubpageUrl}
							</a>
						{/if}
					</span>
				</div>
			</div>
			{#if providers && userInfo.account_type === 'password'}
				{#each providers as provider}
					<button
						type="button"
						onclick={(e) => {
							e.preventDefault();
							AddProvider(provider.id);
						}}
						class="variant-ghost btn">Link my account with {provider.name}</button
					>
				{/each}
			{/if}
			{#if userInfo.account_type === 'federated_password'}
				<div class="my-4 flex items-center justify-between">
					<span>Your account is linked to a provider</span>
					<button
						type="button"
						onclick={() => {
							fetch('/auth/v1/providers/link', {
								method: 'DELETE',
								headers: [['csrf-token', localStorage.getItem('csrfToken')!]]
							})
								.then(() => {
									window.location.reload();
								})
								.catch((err) => console.log(err));
						}}
						class="btn rounded-lg bg-red-500 px-2 py-1 font-bold text-white hover:bg-red-700"
					>
						Unlink
					</button>
				</div>
			{/if}

			<label class="label">
				<span>Username</span>
				<input name="username" class="input" placeholder="Username" bind:value={username} />
				{#if !profile?.username}<div class="pl-3 text-sm">
						Set a username to claim your profile page.
					</div>{/if}
			</label>
			<label class="label">
				<span>Display Name</span>
				<input name="display_name" class="input" placeholder={username} bind:value={display_name} />
			</label>

			<!-- Temporarily disable avatars -->
			<label>
				<span>Avatar</span>
				<input name="avatar" type="file" class="input" accept=".jpg, .jpeg, .png, .webp, .gif" />
			</label>

			<label class="label">
				<span>Bio</span>
				<textarea
					name="bio"
					class="textarea"
					placeholder="Tell people more about you..."
					rows="5"
					bind:value={bio}
				>
				</textarea>
			</label>

			<label>
				<span>Links</span>
				<div class="flex flex-col gap-2">
					{#each links as link, index}
						<div class="row flex gap-2">
							<input bind:value={link.label} name="link-label" class="input" placeholder="Label" />
							<input
								bind:value={link.url}
								name="link-url"
								class="input"
								placeholder="https://example.com"
							/>
							<button
								type="button"
								title="Remove Link"
								class="variant-ghost-surface btn btn-icon flex-shrink-0"
								onclick={() => {
									links.splice(index, 1);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									fill="currentColor"
									class="bi bi-trash"
									viewBox="0 0 16 16"
								>
									<path
										d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
									/>
									<path
										d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"
									/>
								</svg>
							</button>
						</div>
					{/each}
					<div class="row flex gap-2">
						<input
							name="link-label"
							bind:value={nextLink.label}
							class="input"
							placeholder="Label"
						/>
						<input
							name="link-url"
							bind:value={nextLink.url}
							class="input"
							placeholder="https://example.com"
						/>
						<button
							type="button"
							title="Add Link"
							class="variant-ghost-surface btn btn-icon flex-shrink-0 text-2xl"
							onclick={() => {
								links.push({ ...nextLink });
								nextLink.label = '';
								nextLink.url = '';
							}}>+</button
						>
					</div>
				</div>
			</label>

			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="label">
				<span>Tags</span>
				<input
					bind:value={tagsString}
					name="tags"
					class="input"
					placeholder="Interest, skill, etc."
				/>
				<div class="text-surface-600-300-token ml-3 text-sm">Separate tags by commas.</div>
				<div class="ml-4 mt-1 flex flex-wrap gap-2">
					{#each tags as tag}
						<div class="bg-surface-200-700-token rounded-md p-1 text-sm">{tag}</div>
					{/each}
				</div>
			</label>

			<!-- <label class="label">
				<span>Sub-Profiles</span>
				<div class="row flex gap-2">
					<input
						name="mastodon_server"
						class="input"
						placeholder="Mastodon Server"
						bind:value={mastodon_server}
					/>
					<button type="button" class="variant-ghost-surface btn" onclick={LinkWithMastodon}
						>Link With Mastodon</button
					>
				</div>
			</label>

			<input type="hidden" name="mastodon_username" bind:value={mastodon_username} /> -->

			<button class="variant-filled btn mt-4"> Save </button>
		</form>
	</main>
{/if}
