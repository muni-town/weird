<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';
	import confetti from 'canvas-confetti';

	function fireworks() {
		var duration = 3 * 1000;
		var animationEnd = Date.now() + duration;
		var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		var interval = setInterval(function () {
			var timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			var particleCount = 50 * (timeLeft / duration);
			// since particles fall down, start a bit higher than random
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			});
		}, 400);
	}

	let loading = $state(true);

	onMount(() => {
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) fireworks();

		const interval = setInterval(async () => {
			const resp = await fetch($page.url.href + '/check');
			if (resp.status == 200) {
				loading = false;
				clearInterval(interval);
			}
		}, 1000);
	});
</script>

<main class="relative mt-8 flex flex-col items-center gap-4 px-2">
	<h1 class="text-4xl font-bold">Order Confirmed 🎉</h1>

	<p class="px-3 text-center">
		Thank you for your subscription! We are now processing your order and setting you up.
	</p>

	{#if loading}
		<div transition:fade>
			<ProgressRadial width="w-[5em] absolute top-[6em]" />
		</div>
	{/if}

	{#if !loading}
		<button
			transition:fade
			class="variant-ghost btn absolute top-[13em]"
			onclick={() => (window.location.href = '/my-profile')}
			disabled={loading}>Go to Profile</button
		>
	{/if}
</main>
