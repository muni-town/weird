<script>
	import { env } from '$env/dynamic/public';
	import { getUserInfo } from '$lib/rauthy';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';
	import { getDrawerStore } from '@skeletonlabs/skeleton';

	const userInfo = getUserInfo();

	const drawerStore = getDrawerStore();

	const openDrawer = () => {
		drawerStore.open();
	};
</script>

<AppBar>
	<svelte:fragment slot="lead"
		><img src="/logo.png" alt="Weird Logo" width="40px" /></svelte:fragment
	>
	<svelte:fragment slot="default"
		><h1 class="text-xl font-bold"><a href="/">Weird.one</a></h1></svelte:fragment
	>
	<svelte:fragment slot="trail">
		<div class="hidden items-center gap-3 sm:flex">
			<a href="/members" class="variant-ghost btn">Members</a>
			{#if !userInfo}
				<a href="/auth/v1/account" class="variant-ghost btn">Login</a>
				<a href="/auth/v1/users/register" class="variant-ghost btn">Register</a>
			{:else}
				<a href="/auth/v1/account" class="variant-ghost btn">Profile</a>
				<a href="/auth/v1/oidc/logout" class="variant-ghost btn">Logout</a>
			{/if}
			<LightSwitch />
		</div>
		<div class="sm:hidden">
			<button class="variant-ghost btn-icon" onclick={openDrawer}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="currentColor"
					class="bi bi-list"
					viewBox="0 0 16 16"
				>
					<path
						fill-rule="evenodd"
						d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
					/>
				</svg>
			</button>
		</div>
	</svelte:fragment>
</AppBar>

<slot></slot>

<div class="mt-12 text-center text-xs text-surface-500">
	Avatars generated with
	<a class="underline" href="https://dicebear.com">DiceBear</a> and the
	<a class="underline" href={`https://dicebear.com/styles/${env.PUBLIC_DICEBEAR_STYLE}`}
		>{env.PUBLIC_DICEBEAR_STYLE}</a
	> style.
</div>

<style>
</style>
