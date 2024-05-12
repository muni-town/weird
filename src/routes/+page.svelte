<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<main class="flex-col justify-center p-4 text-center">
	<h1 class="mt-8 text-4xl font-bold">Weird Web Pages</h1>
	<p class="mt-4 text-lg">Materializing the web from first principles.</p>

	<div class="mt-8">
		{JSON.stringify(data)}
	</div>
</main>
