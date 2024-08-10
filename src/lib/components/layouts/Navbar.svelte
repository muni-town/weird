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

<AppBar background="bg-transparent">
	<svelte:fragment slot="lead">
		<h1 class="text-xl font-black uppercase text-yellow-200"><a href="/">weird</a></h1>
	</svelte:fragment>

	<svelte:fragment slot="trail">
		<div class="font-bold text-white">
			<a href="/members" class="btn">Members</a>
			{#if !userInfo}
				<a href="/auth/v1/account" class="btn">Login</a>
				<a href="/auth/v1/users/register" class="btn">Register</a>
			{:else}
				<a href="/auth/v1/account" class="btn">Profile</a>
				<a href="/auth/v1/oidc/logout" class="btn">Logout</a>
			{/if}
		</div>

		<div class="sm:hidden">
			<button class="variant-ghost btn-icon" onclick={openDrawer} aria-label="Toggle drawer">
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
