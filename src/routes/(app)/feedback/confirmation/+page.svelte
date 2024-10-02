<script>
	import { env } from '$env/dynamic/public';
	import FeedbackPage from './componenets/FeedbackPage.svelte';

	const pageTitle = `Feedback Sent | ${env.PUBLIC_INSTANCE_NAME}`;
</script>

<FeedbackPage {pageTitle} />
