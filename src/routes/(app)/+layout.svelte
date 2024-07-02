<script lang="ts">
	import type { LayoutData } from './$types';
	import DefaultLayout from '$lib/components/layouts/DefaultLayout.svelte';
	import '../../app.css';
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

		<li>
			<a
				href="/feedback"
				class="variant-ghost btn flex gap-3"
				title="Leave Feedback"
				onclick={closeDrawer}
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
				Leave Feedback
			</a>
		</li>
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
