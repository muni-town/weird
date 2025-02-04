<script lang="ts">
	type Page = {
		slug: string;
		name?: string;
	};
	let { pages: _pages = $bindable() }: { pages: Page[] } = $props();
	let pages = $state.raw(_pages);
</script>
<div>
	<h2 class="mb-4 text-center font-rubik text-2xl font-bold">Pages</h2>
	<ul class="mt-6 flex items-center gap-10">
			{#each pages as p, index (p.slug)}
					<li>
							<a class="link">
								{p.name || p.slug}
							</a>
					</li>
			{/each}
	</ul>
</div>

<style>
	.link {
		color: black;
		font-family: 'Rubik Mono One';
		background-color: #a092e3;
		padding: var(--size-fluid-1) var(--size-fluid-2);
		border: var(--border-size-2) solid black;
		border-radius: var(--radius-2);
		box-shadow: 0.35rem 0.45rem black;
		text-decoration: none;
		text-align: center;
	}
</style>
