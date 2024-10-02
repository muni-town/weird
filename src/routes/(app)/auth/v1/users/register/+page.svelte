<script lang="ts">
	import { get_pow_challenge } from '$lib/rauthy/client';
	import { checkResponse } from '$lib/utils/http';
	import { env } from '$env/dynamic/public';
	import { Pow } from '$lib/pow';

	import RegisterPage from './components/RegisterPage.svelte';

	let processing = $state(false);
	let error = $state('');
	let powResult = $state('');

	async function onsubmit(event: SubmitEvent) {
		processing = true;
		event.preventDefault();
		try {
			let challenge = await get_pow_challenge();
			console.debug('Computing proof of work');
			console.log(challenge);
			powResult = Pow.work(challenge);
			console.debug('Completed proof of work', powResult);
			if (!powResult) {
				error = 'Error computing proof of work.';
				processing = false;
				return;
			}
		} catch (e) {
			processing = false;
			error = `Error computing proof of work: ${e}`;
			return;
		}

		try {
			const formData = new FormData(event.target as HTMLFormElement);
			const email = formData.get('email') as string;

			const home = new URL(window.location.href);
			home.pathname = '/my-profile';
			const registerResp = await fetch('/auth/v1/users/register', {
				method: 'post',
				body: JSON.stringify({
					email,
					given_name: 'Weird',
					family_name: 'User',
					// This isn't really used, we do the redirect manually.
					redirect_uri: home,
					pow: powResult
				})
			});
			await checkResponse(registerResp);

			window.location.replace('/account/register/confirmation');
		} catch (e) {
			processing = false;
			error = `Error registering user: ${JSON.stringify(e)}`;
			return;
		}
	}

	const pageTitle = `Register | ${env.PUBLIC_INSTANCE_NAME}`;
</script>

<RegisterPage {pageTitle} {error} {onsubmit} {processing} />
