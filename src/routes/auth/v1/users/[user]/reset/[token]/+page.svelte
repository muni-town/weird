<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<main class="flex flex-col items-center">
	<form method="POST" class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		<h1 class="my-3 text-2xl">Reset Password</h1>
		<p>You have requested a password reset. Input your new password now.</p>
		<label class="label">
			<span>Password</span>
			<input name="password" class="input" type="text" placeholder="Password" />
		</label>
	</form>

	<button class="variant-filled btn"> Set Password </button>
</main>
