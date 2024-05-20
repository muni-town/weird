<script lang="ts">
	import getPkce from 'oauth-pkce';
	import { getUserInfo } from '$lib/rauthy';
	import { onMount } from 'svelte';

	const userInfo = getUserInfo();
	const PKCE_VERIFIER = 'pkce_verifier';

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
		<div class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
			<h1 class="my-3 text-2xl">User Account</h1>

			<p class="text-xl">
				{userInfo.email}
			</p>
		</div>
	</main>
{/if}
