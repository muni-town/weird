<script>
	import { env } from '$env/dynamic/public';
</script>

<svelte:head>
	<title>Account Created | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex flex-col items-center">
	<div class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		Account registered! We have sent you a confirmation email. You may close this page and continue
		with the link in the email.
	</div>
</main>
