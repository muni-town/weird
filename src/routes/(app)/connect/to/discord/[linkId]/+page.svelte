<script lang="ts">
	import type { PageData, ActionData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();
	const linkId = data.linkId;
</script>

<main class="flex flex-col items-center">
	<div class="card mt-8 max-w-[600px] p-4">
		<h2 class="text-2xl font-bold">Connect to Discord</h2>
		<p class="my-4">Continuing will connect your Discord account to your Weird account.</p>
		<form method="post">
			<input type="hidden" name="link_id" value={linkId} />
			<div class="flex justify-end">
				{#if form}
					<div class="p-7 text-xl">
						{#if form.success}
							<p class="text-green-700">Successfully connected account. You may close this tab.</p>
						{:else if form.error}
							<p class="text-red-500">Error logging in: {form.error}</p>
						{/if}
					</div>
				{/if}

				{#if !form?.success}
					<button class="my-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
						>Grant Access</button
					>
				{/if}
			</div>
		</form>
	</div>
</main>
