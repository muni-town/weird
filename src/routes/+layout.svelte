<script lang="ts">
	import type { LayoutData } from './$types';
	import DefaultLayout from '$lib/components/layouts/DefaultLayout.svelte';
	import '../app.css';
	import { setSessionInfo, setUserInfo } from '$lib/rauthy';
	import type { Snippet } from 'svelte';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';

	initializeStores();

	const drawerStore = getDrawerStore();
	const closeDrawer = () => drawerStore.close();

	const { data, children }: { data: LayoutData; children: Snippet } = $props();
	setSessionInfo(data.sessionInfo);
	setUserInfo(data.userInfo);
</script>

<Drawer>
	<ul class="list-nav">
		<div class="ml-5 p-3 text-xl">Menu</div>
		<li>
			<a href="/members" class="variant-ghost btn" onclick={closeDrawer}>Members</a>
		</li>
		{#if !data.userInfo}
			<li>
				<a href="/auth/v1/account" class="variant-ghost btn" onclick={closeDrawer}>Login</a>
			</li>
			<li>
				<a href="/auth/v1/users/register" class="variant-ghost btn" onclick={closeDrawer}
					>Register</a
				>
			</li>
		{:else}
			<li>
				<a href="/auth/v1/account" class="variant-ghost btn" onclick={closeDrawer}>Profile</a>
			</li>
			<li>
				<a href="/auth/v1/oidc/logout" class="variant-ghost btn" onclick={closeDrawer}>Logout</a>
			</li>
		{/if}
	</ul>
</Drawer>

<DefaultLayout>
	{@render children()}
</DefaultLayout>

<style>
	ul.list-nav li {
		margin: 1em !important;
	}
</style>
