<script lang="ts">
	import getPkce from 'oauth-pkce';
	import { getUserInfo } from '$lib/rauthy';
	import { env } from '$env/dynamic/public';
	import type { WorkCapacity, WorkCompensation } from '../auth/v1/account/proxy+page.server';
	import type { PageData } from './$types';
	import Avatar from '$lib/components/Avatar.svelte';
	import { parseUsername } from '$lib/utils';
	import {onMount} from 'svelte';

	const { data }: { data: PageData } = $props();

	const profiles = data.profiles;
	const parsedUsername =
		(data.profile?.username && parseUsername(data.profile.username)) || undefined;

	let username = $state(parsedUsername?.name || '');
	let display_name = $state(data.profile?.display_name || '');
	let avatar_seed = $state(data.profile?.avatar_seed || data.profile?.username || '');
	let location = $state(data.profile?.location || '');
	let contact_info = $state(data.profile?.contact_info || '');
	let work_capacity = $state(data.profile?.work_capacity);
	let work_compensation = $state(data.profile?.work_compensation);
	let bio = $state(data.profile?.bio || '');
	let links = $state(data.profile?.links || []);
	let nextLink = $state({ label: '', url: '' } as { label?: string; url: string });

	let mastodon_server = $state(data.profile?.mastodon_server || '');
	let mastodon_username = $state(data.profile?.mastodon_username || '');

	let tags = $state(data.profile?.tags || []);
	let search = $state(data.search || '');

	const printWorkCapacity = (c?: WorkCapacity): string => {
		if (c == 'full_time') {
			return 'Full Time';
		} else if (c == 'part_time') {
			return 'Part Time';
		} else {
			return 'Not Specified';
		}
	};
	const printWorkCompensation = (c?: WorkCompensation): string => {
		if (c == 'paid') {
			return 'Paid';
		} else if (c == 'volunteer') {
			return 'Volunteer';
		} else {
			return 'Not Specified';
		}
	};

	const userInfo = getUserInfo();
	const PKCE_VERIFIER = 'pkce_verifier';

	onMount(async () => {
		const url = new URL(window.location.href);
		const code = url.searchParams.get('code');
		if(!code) return;

		const reloaded = localStorage.getItem('reloaded');
		// FIX: user information is not loaded directly after redirecting from mastodon
		await new Promise(resolve => setTimeout(resolve, 1000));
		if(!reloaded){
			localStorage.setItem('reloaded', 'true');
			window.location.reload();
			return;
		}
		
		const app_data = JSON.parse(localStorage.getItem('app_data') ?? '');
		const mastodon_server = app_data.mastodon_server;
		
		const response = await fetch(`${mastodon_server}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: app_data.client_id,
				client_secret: app_data.client_secret,
				code: code,
				grant_type: 'authorization_code',
				redirect_uri: app_data.redirect_uri,
			}),
		});
		const data = await response.json();
		console.log(data)
		localStorage.setItem('access_token', data.access_token);
		localStorage.setItem('mastodon_server', mastodon_server);

		// get user info
		const user_response = await fetch(`${mastodon_server}/api/v1/accounts/verify_credentials`, {
			headers: {
				'Authorization': `Bearer ${data.access_token}`
			}
		});
		const user_data = await user_response.json();
		console.log(user_data, work_capacity)
		// send formdata to /auth/account/update
		const form_data = new FormData();
		form_data.append('mastodon_server', mastodon_server);
		form_data.append('mastodon_username', user_data.username);
		form_data.append('username', username);
		form_data.append('display_name', display_name);
		form_data.append('avatar_seed', avatar_seed);
		form_data.append('location', location);
		form_data.append('contact_info', contact_info);
		form_data.append('work_capacity', work_capacity ?? 'full_time');
		form_data.append('work_compensation', work_compensation ?? 'paid');
		form_data.append('bio', bio);
		form_data.append('tags', tags.join(','));
		links.forEach(link => {
			form_data.append('link-label', link.label ?? '');
			form_data.append('link-url', link.url ?? '');
		});
		console.log(JSON.stringify(Object.fromEntries(form_data.entries())));
		await fetch('/account/update', {
			method: 'POST',
			body: form_data
		}).then(res => console.log(res.json())).catch(err => console.log(err));
		localStorage.removeItem('reloaded');
		window.location.href = `/sites/${username}`;

	})

	function handleFormSubmit(event : SubmitEvent) {
		event.preventDefault(); 
		let inputted_value = (event.target as HTMLFormElement)["mastodonServer"]!.value;
		let mastodon_server = inputted_value.startsWith('https://') ? inputted_value : `https://${inputted_value}`;
		mastodon_server = mastodon_server.endsWith('/') ? mastodon_server.slice(0, -1) : mastodon_server;
		fetch(mastodon_server + '/api/v1/apps', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_name: 'Weird Sites',
				redirect_uris: window.location.origin + '/sites',
				scopes: 'read',
				website: window.location.origin,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				let client_id = data.client_id;
				let client_secret = data.client_secret;
				let redirect_uri = data.redirect_uri;
				localStorage.setItem('app_data', JSON.stringify({ client_id, client_secret, redirect_uri, mastodon_server }));
				let redirect_url = `${mastodon_server}/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=read`;
				window.location.href = redirect_url;
			}).catch(err => console.log(err));	
	}
	let filtered_profiles = $derived.by(() => {
		const words = search.split(' ');
		return profiles
			.filter((x) => {
				if (search == '') return true;
				for (const word of words) {
					const wordLowercase = word.toLowerCase();
					for (const field of [
						x.bio,
						x.username,
						printWorkCapacity(x.work_capacity),
						printWorkCompensation(x.work_compensation),
						...(x.tags || [])
					]) {
						const fieldLowercase = field?.toLowerCase();
						if (wordLowercase && fieldLowercase && fieldLowercase.includes(wordLowercase)) {
							return true;
						}
					}
				}
				return false;
			})
			.map((profile) => {
				// Remove the domain for local usernames
				const parsedUsername = profile.username && parseUsername(profile.username);
				const username =
					parsedUsername && parsedUsername.domain == env.PUBLIC_DOMAIN
						? parsedUsername.name
						: profile.username;
				return { ...profile, username };
			});
	});

	let searchBox: HTMLInputElement;

	const setSearch = (e: MouseEvent, s: string) => {
		e.preventDefault();
		search = s;
		searchBox.focus();
	};
</script>

<svelte:head>
	<title>{env.PUBLIC_SITES_TITLE} | {env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="flex max-w-full flex-col items-center">
	<h1 class="mt-8 text-4xl font-bold">{env.PUBLIC_SITES_TITLE}</h1>
	{#if userInfo }
	<form class="mt-5" onsubmit={handleFormSubmit}>
		<input type="text" name="mastodonServer" placeholder="Mastodon Server" required class="dark:bg-[#1f2937] bg-[#f3f4f6]">
		<button  class="variant-ghost btn">Claim My Site</button>
	</form>
	{/if}
	<div class="input-group input-group-divider mt-8 max-w-80 grid-cols-[1fr_auto]">
		<input
			bind:this={searchBox}
			type="text"
			class="input"
			placeholder="Search..."
			bind:value={search}
		/>
		<button class:invisible={search.length == 0} onclick={(e) => setSearch(e, '')}>x</button>
	</div>

	<div class="mt-10 flex max-w-full flex-row flex-wrap justify-center gap-5 px-5">
		{#each filtered_profiles as profile}
			<div
				class="w-120 card relative flex flex-col items-center p-5 transition-transform duration-200 hover:scale-105"
			>
				<div class="flex w-[15em] flex-col items-center text-center">
					<div class="mb-3 flex flex-col flex-wrap items-center gap-4">
						<Avatar width="w-[5em]" seed={profile.avatar_seed || profile.username || ''} />
						<h2 class="text-2xl font-semibold">
							<a href={`/sites/${profile.username}`} class="card-link">
								{profile.display_name || profile.username}
							</a>
						</h2>
					</div>

					<div class="flex max-w-full flex-col gap-4">
						{#if profile.location}
							<div>
								{profile.location}
							</div>
						{/if}
						{#if profile.tags && profile.tags.length > 0}
							<div class="flex max-w-full flex-wrap items-center justify-center gap-2">
								{#each profile.tags as tag}<button
										type="button"
										class="text-surface-900-50-token btn relative rounded-md bg-surface-200 p-1 hover:bg-surface-400 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-700"
										onclick={(e) => setSearch(e, tag)}
									>
										{tag}
									</button>{/each}
							</div>
						{/if}
						{#if profile.contact_info}
							<div>
								{profile.contact_info}
							</div>
						{/if}
						<div>
							{#if profile.work_capacity}
								{printWorkCapacity(profile.work_capacity)}
							{/if}
							{#if profile.work_capacity && profile.work_compensation}
								&nbsp;/&nbsp;
							{/if}
							{#if profile.work_compensation}
								{printWorkCompensation(profile.work_compensation)}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>
