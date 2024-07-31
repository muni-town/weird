<script lang="ts">
	export let set_theme_callback;
	import Minimal from '$lib/themes/minimal.svelte';
	import Retro from '$lib/themes/retro.svelte';
</script>

<div class="panel">
	<h1>Select Themes</h1>
	<p>Choose a theme for your subsite.</p>

	<button onclick={() => set_theme_callback('minimal')}> Minimal </button>
	<button onclick={() => set_theme_callback('retro')}> Retro </button>
</div>

<style>
	.panel {
		padding: 10px 20px;
		background-color: var(--pico-mark-background-color);
		min-height: 100vh;
		height: 100%;
	}
	@media (max-width: 800px) {
		.panel {
			padding: 30px 20px;
			min-height: auto;
		}
	}
</style>
