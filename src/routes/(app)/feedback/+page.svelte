<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Pow } from '$lib/pow';
	import { checkResponse } from '$lib/utils/http';
	import FeedbackPage from './components/FeedbackPage.svelte';

	let processing = $state(false);
	let error: string | null = $state(null);
	let powResult = $state('');

	async function get_pow_challenge() {
		const resp = await fetch('/feedback/pow');
		// checkResponse(resp);
		return await resp.text();
	}

	async function handleSubmit(event: SubmitEvent) {
		processing = true;
		event.preventDefault();
		try {
			// TODO: add proof-of-work challenge for feedback form.
			let challenge = await get_pow_challenge();
			console.debug('Computing proof of work', challenge);
			powResult = Pow.work(challenge) || '';
			console.debug('Completed proof of work', powResult);

			if (powResult === '') {
				processing = false;
				throw 'Error computing proof of work, you may need a browser update.';
			}

			// Getting a bit of a race condition without requestAnimationFrame
			requestAnimationFrame(() => {
				const form = event.target as HTMLFormElement;
				form.submit();
			});
		} catch (e) {
			processing = false;
			error = `${e}`;
		}
	}

	const pageTitle = `Feedback | ${env.PUBLIC_INSTANCE_NAME}`;
</script>

<FeedbackPage {handleSubmit} {pageTitle} {processing} {error} {powResult} />
