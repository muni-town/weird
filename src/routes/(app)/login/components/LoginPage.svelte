<script lang="ts">
	import type { PageData } from '../$types';

	import LoginForm from './LoginForm.svelte';

	interface props {
		pageTitle: string;
		justResetPassword: boolean;
		loading: boolean;
		error: string;
		providers: PageData['providers'];
		providerLogin: (id: string) => void;
		onsubmit: (event: SubmitEvent) => void;
	}

	const {
		pageTitle,
		justResetPassword,
		providerLogin,
		onsubmit,
		loading,
		error,
		providers
	}: props = $props();
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<LoginForm {loading} {error} {providers} {justResetPassword} {providerLogin} {onsubmit} />
</main>
