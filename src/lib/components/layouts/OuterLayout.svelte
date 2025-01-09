<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SessionInfo } from '$lib/rauthy';

	import { env } from '$env/dynamic/public';
	import { AppBar } from '@skeletonlabs/skeleton';

	const { sessionInfo, children }: { sessionInfo?: SessionInfo; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<div class="stars"></div>

<AppBar background="bg-pink-300/20">
	{#snippet lead()}
		<img src="/favicon.png" alt="Weird Logo" width="40px" />
	{/snippet}

	<h1 class="font-rubik text-xl font-bold text-secondary-500">
		<a href="/">WEIRD</a>
	</h1>

	{#snippet trail()}
		<div class="items-center gap-3 font-spacemono sm:flex">
			{#if sessionInfo?.groups?.includes('admin')}
				<a
					data-sveltekit-reload
					href="/__internal__/admin"
					class="btn hover:scale-105 hover:bg-surface-100/5"
				>
					Admin
				</a>
			{/if}

			<a href="https://a.weird.one" class="btn hover:scale-105 hover:bg-surface-100/5">About</a>
			<a href="/people" class="btn hover:scale-105 hover:bg-surface-100/5">People</a>

			{#if !sessionInfo}
				<a href="/login" class="btn hover:scale-105 hover:bg-surface-100/5">Sign-in</a>
			{:else}
				<a href="/my-profile" class="btn hover:scale-105 hover:bg-surface-100/5">Profile</a>
				<a href="/logout" class="btn hover:scale-105 hover:bg-surface-100/5">Logout</a>
			{/if}
			<a
				href="/feedback"
				class="btn hover:scale-105 hover:bg-surface-100/5"
				title="Leave Feedback"
				aria-label="Feedback"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					class="bi bi-megaphone"
					viewBox="0 0 16 16"
				>
					<path
						d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1h-.548a1 1 0 0 1-.916-.599l-1.85-3.49-.202-.003A2.014 2.014 0 0 1 0 9V7a2.02 2.02 0 0 1 1.992-2.013 75 75 0 0 0 2.483-.075c3.043-.154 6.148-.849 8.525-2.199zm1 0v11a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-1 0m-1 1.35c-2.344 1.205-5.209 1.842-8 2.033v4.233q.27.015.537.036c2.568.189 5.093.744 7.463 1.993zm-9 6.215v-4.13a95 95 0 0 1-1.992.052A1.02 1.02 0 0 0 1 7v2c0 .55.448 1.002 1.006 1.009A61 61 0 0 1 4 10.065m-.657.975 1.609 3.037.01.024h.548l-.002-.014-.443-2.966a68 68 0 0 0-1.722-.082z"
					/>
				</svg>
			</a>
		</div>
	{/snippet}
</AppBar>

<div class="weird-container relative flex h-full min-h-screen max-w-full flex-col">
	<div class="max-w-full flex-grow">
		{@render children()}
	</div>

	<footer class="bottom-0 p-4 text-center text-xs text-surface-300">
		Default avatars generated with
		<a class="underline" href="https://dicebear.com">DiceBear</a> and the
		<a class="underline" href={`https://dicebear.com/styles/${env.PUBLIC_DICEBEAR_STYLE}`}
			>{env.PUBLIC_DICEBEAR_STYLE}</a
		> style.
	</footer>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');

	@font-face {
		font-family: Uncut Sans;
		src: url('/UncutSans-Variable.woff2');
	}

	:global(body) {
		background: linear-gradient(180deg, #240940 20%, #8e4569 60%, #cb5873);
		background-repeat: no-repeat;
		background-size: cover;
		position: relative;
	}

	.stars {
		background: url('/stars.avif');
		pointer-events: none;
		/* extend a bit more than the viewport */
		height: 100%;
		width: 100%;
		background-position: center;
		background-size: 1500px;
		background-repeat: repeat;
		position: absolute;
		left: 0;
		top: 0;
		overflow: hidden;
		opacity: 0.25;
	}
</style>
