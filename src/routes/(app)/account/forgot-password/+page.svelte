<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { checkResponse } from '$lib/utils/http';
	import { onMount } from 'svelte';

	import ForgotPasswordPage from './componenets/ForgotPasswordPage.svelte';

	let success = $state(false);

	onMount(async () => {
		success = new URL(window.location.href).searchParams.get('success') != null;
		const initResp = await fetch('/auth/v1/oidc/session', { method: 'post' });
		const init = await initResp.json();
		localStorage.setItem('csrfToken', init.csrf_token);
	});

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const email = formData.get('email') as string;

		try {
			const resp = await fetch(`/auth/v1/users/request_reset`, {
				method: 'post',
				body: JSON.stringify({ email }),
				headers: [
					['csrf-token', localStorage.getItem('csrfToken')!],
					['content-type', 'application/json']
				]
			});
			await checkResponse(resp);
			localStorage.setItem('justResetPassword', 'true');
			window.location.replace('?success');
		} catch (e) {
			console.error(e);
		}
	}

	const pageTitle = `Forgot Password | ${env.PUBLIC_INSTANCE_NAME}`;
</script>

<ForgotPasswordPage {pageTitle} {success} {onsubmit} />
