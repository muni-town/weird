<script lang="ts">
	let showPassword = $state(false);
</script>

<main class="flex flex-col items-center">
	<form class="card mt-12 flex w-[600px] max-w-[90%] flex-col gap-4 p-8">
		<h1 class="my-3 text-2xl">Login</h1>
		<label class="label">
			<span>Email</span>
			<input name="email" class="input" type="text" placeholder="Email" />
		</label>

		{#if showPassword}
			<label class="label">
				<span>Password</span>
				<input name="password" class="input" type="password" placeholder="Password" />
			</label>
		{/if}

		<div class="mt-4 flex flex-col gap-2">
			<p class="text-center">
				Don't have an account?
				<a href="/account/register" class="underline">Register a new account</a>.
			</p>

			<button class="variant-filled btn"> Login </button>
		</div>
	</form>
</main>
