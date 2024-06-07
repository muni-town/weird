<script lang="ts">
	import getPkce from 'oauth-pkce';
	import { getUserInfo } from '$lib/rauthy';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import Avatar from '$lib/components/Avatar.svelte';

	const { data }: { data: PageData } = $props();

	const userInfo = getUserInfo();
	const PKCE_VERIFIER = 'pkce_verifier';

	let username = $state(data.profile?.username || '');
	let avatar_seed = $state(data.profile?.avatar_seed || '');
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
		if (!userInfo) {
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
</script>

{#if userInfo}
	<main class="flex flex-col items-center">
		<form
			method="post"
			action="/account/update"
			class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8 text-xl"
		>
			<div class="mb-4 flex items-center gap-3">
				<Avatar username={avatar_seed} />
				<h1 class="my-3 text-2xl">Profile</h1>
			</div>

			<div class="mb-4">
				<div>
					<strong class="pr-2">Email:</strong>{userInfo.email}
				</div>
				<div>
					<strong class="pr-2">Profile Page:</strong>
					{#if data.profile?.username}
						<a class="underline" href={`${baseUrl}u/${data.profile?.username}`}>
							{`${baseUrl}u/${data.profile?.username}`}
						</a>
					{:else}Username Not Set{/if}
				</div>
			</div>

			<label class="label">
				<span>Username</span>
				<input name="username" class="input" placeholder="Username" bind:value={username} />
				{#if !data.profile?.username}<div class="pl-3 text-sm">
						Set a username to claim your profile page.
					</div>{/if}
			</label>
			<label class="label">
				<span>Avatar Seed</span>
				<input name="avatar_seed" class="input" placeholder="I am a robot..." bind:value={avatar_seed} />
				<div class="pl-3 text-sm">Your avatar is randomly generated from this text.</div>
			</label>

			<button class="variant-filled btn mt-4"> Save </button>
		</form>
	</main>
{/if}
