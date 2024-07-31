<script lang="ts">
	export let form;
</script>

<div class="mx-auto max-w-md py-6">
	{#if form?.error}
		<aside class="alert variant-ringed-error mb-4">
			<!-- Message -->
			<div class="alert-message">
				<p>{form.error}</p>
			</div>
		</aside>
	{/if}
	<form method="post">
		<div class="card">
			<header class="card-header">
				<h3 class="text-xl font-bold">Authenticate Zulip</h3>
			</header>
			<section class="grid grid-cols-1 gap-4 p-4">
				<label class="label flex flex-col gap-1">
					<span>Zulip domain</span>
					<input name="domain" class="input" type="text" placeholder="Enter Zulip domain" />
				</label>

				<label class="label flex flex-col gap-1">
					<span>Zulip email</span>
					<input name="email" class="input" type="text" placeholder="Enter Zulip email address" />
				</label>

				<label class="label flex flex-col gap-1">
					<span>Zulip api key</span>
					<input name="apiKey" class="input" type="text" placeholder="Enter Zulip api key" />
				</label>
			</section>
			<footer class="card-footer">
				<button type="submit" class="variant-filled btn w-full">Continue</button>
			</footer>
		</div>
	</form>
</div>
