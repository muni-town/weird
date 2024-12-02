<script lang="ts">
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import AvatarEditor from '$lib/components/avatar/editor.svelte';
	import EditLinks from '$lib/components/pubpage-admin/edit-links.svelte';
	import type { Profile } from '$lib/leaf/profile';
	import { renderMarkdownSanitized } from '$lib/utils/markdown';
	import type { Snippet } from 'svelte';

  type Props = {
    avatar: string;
    profile: Profile;
    token: any;
    is_author: boolean;
    footer: Snippet;
    setAvatar: (new_avatar: string) => void;
    setUnsavedChanges: (value: boolean) => void;
  }

  let { avatar, profile, token, is_author, setAvatar, setUnsavedChanges, footer }: Props = $props();

	let editingTags = false;
	let linkLabel = '';
	let linkUrl = '';

	type WorkCapacity = 'full_time' | 'part_time' | 'not_specified';
	type WorkCompensation = 'paid' | 'volunteer' | 'not_specified';
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

	let initialLoaded = true;
	$effect(() => {
		if (profile && !initialLoaded) {
			setUnsavedChanges(true);
		}
		initialLoaded = false;
  });

	let editingAvatar = '';
	const ChangeAvatar = (e: any) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			editingAvatar = e.target!.result as string;
		};
		reader.readAsDataURL(file);
	};

	const editLinkCallback = (label: string, url: string) => {
		editingTags = false;
		setUnsavedChanges(true);
		profile.links = profile.links?.map((link) => {
			if (link.label === linkLabel && link.url === linkUrl) {
				link.url = url;
				link.label = label;
			}
			return link;
		});
		if (linkLabel === '' && linkUrl === '' && profile.links) {
			profile.links.push({ label, url });
		}
	};
	const addTags = () => {
		profile.tags = profile.tags || [];
		profile.tags.push('(newly added tag)');
	};
	const deleteTag = (tag: string) => {
		profile.tags = profile.tags.filter((t) => t !== tag);
	};
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/pico.css/dist/pico.min.css" />
</svelte:head>

{#if profile}
	{#if editingAvatar != ''}
		<AvatarEditor
			img={editingAvatar}
			cancelCallback={() => (editingAvatar = '')}
			saveCallback={(new_avatar) => {
				avatar = new_avatar;
				editingAvatar = '';
				setAvatar(new_avatar);
			}}
		/>
	{/if}

	<main> 

    <section class="container">
      <EditLinks label={linkLabel} url={linkUrl} open={editingTags} saveCallback={editLinkCallback} />
      <input type="file" onchange={ChangeAvatar} name="avatar" style="display: none;" />
      {#if is_author}
        <figure class="avatar-figure">
          <img src={avatar} width="200px" alt="Avatar" />
          <figcaption class="avatar-figcaption">
            <label
              for="avatar"
              onclick={() => document.querySelector('input[name="avatar"]')?.click()}
            >
              <img src="/edit-avatar.png" />
            </label>
          </figcaption>
        </figure>
      {:else}
        <img src={avatar} width="200px" alt="Avatar" />
      {/if}
      {#if is_author}
        <h1
          contenteditable="true"
          bind:textContent={profile.display_name}
          style="margin-top: 1em;"
        ></h1>
      {:else}
        <h1 style="margin-top: 1em;">{profile.display_name}</h1>
      {/if}
      <span>
        {$page.url.host.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0]}
      </span>


      {#if profile.bio}
        {#if is_author}
          <p
            style="max-width: 800px; text-align:justify;"
            bind:textContent={profile.bio}
            contenteditable="true"
          ></p>
        {:else}
          <div class="prose mx-auto max-w-[800px] dark:prose-invert">
            {@html renderMarkdownSanitized(profile.bio)}
          </div>
        {/if}
      {/if}

      {#if profile.tags && profile.tags.length > 0}
        <div class="tags">
          {#each profile.tags as tag}
            {#if is_author}
              <span contenteditable="true" class="tag">
                {tag}
              </span>
              <span
                style="color: var(--pico-del-color); cursor: pointer; margin-right: 1rem;"
                onclick={() => deleteTag(tag)}>&times;</span
              >
            {:else}
              <a href={`${env.PUBLIC_URL}/people?q=${tag}`} target="_blank" class="tag">
                {tag}
              </a>
            {/if}
          {/each}
          {#if is_author}
            <span
              onclick={addTags}
              style="color: var(--pico-primary); cursor: pointer;"
              title="Add tag"
            >
              +
            </span>
          {/if}
        </div>
      {/if}
    </section>

		<div class="links container">
			<a href={`${env.PUBLIC_URL}/${$page.url.host}`} class="link">Weird</a>
			{#if profile.links}
				{#each profile.links as link}
					{#if is_author}
						<a
							href={link.url}
							target="_blank"
							onclick={(e) => (
								e.preventDefault(),
								(editingTags = true),
								(linkLabel = link.label!),
								(linkUrl = link.url!)
							)}
							class="link"
						>
							{link.label}
						</a>
					{:else}
						<a href={link.url} target="_blank" class="link">
							{link.label || link.url}
						</a>
					{/if}
				{/each}
			{/if}
			{#if is_author}
				<span
					class="link"
					style="color: var(--pico-primary); cursor: pointer;"
					onclick={() => ((editingTags = true), (linkLabel = ''), (linkUrl = ''))}
					title="Add link"
				>
					+
				</span>
			{/if}
		</div>

    {@render footer()}
	</main>
{/if}

<style>
	main {
    width: 100vw;
    height: 100vh;
		display: flex;
		align-items: center;
    justify-content: center;
		flex-direction: column;
    padding: 2.25rem 2.25rem;
    background: rgb(46,16,101);
    background: linear-gradient(180deg, rgba(46,16,101,1) 0%, rgba(107,33,168,1) 25%, rgba(208,42,109,1) 100%);
    font-family: monospace;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem;
    border: 4px solid black;
    border-radius: 0.75rem;
    max-width: 42rem;
    backdrop-filter: blur(1.5rem);
  }

  .tags {
    display: flex; 
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

	.tag {
		color: black;
    text-decoration: none;
		font-weight: 400;
		font-size: 16px;
    background-color: #a78bfa;
    border: 2px solid black;
    border-radius: 9999px;
    text-align: center;
    width: fit-content;
    padding: 0.25rem 0.75rem;
	}

	.links {
		display: flex;
		flex-direction: column;
		align-items: center;
    gap: 1rem;
    padding-top: 1.75rem;
    padding-bottom: 1.75rem;
	}

	.link {
    text-align: center;
    width: 100%;
    padding: 1rem 2rem;
    background-color: #a78bfa;
    text-decoration: none;
    color: black;
    border-radius: 0.5rem;
    border: 2px solid black;
    font-weight: bold;
    box-shadow: 0.25rem 0.25rem black;
  }

	.avatar-figure {
		position: relative;
		border-radius: 100%;
    border: 4px solid black;
	}

	.avatar-figure img {
		position: relative;
		z-index: -3;
	}

	.avatar-figcaption {
		position: absolute;
		bottom: 0;
		right: 0;
		border-radius: 100%;
		background-color: var(--pico-secondary);
		height: 70px;
		width: 70px;
		z-index: 1;
	}

	.avatar-figcaption img {
		height: 50px;
		width: 50px;
		display: block;
		margin: auto;
		margin-top: 0px;
		z-index: 2;
	}
</style>
