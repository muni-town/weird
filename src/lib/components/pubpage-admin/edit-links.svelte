<script lang="ts">
	export let label: string;
	export let url: string;
	export let open = false;
	export let saveCallback: (label: string, url: string) => void;
</script>

{#if open}
	<dialog open>
		<article>
			<header>
				<button aria-label="Close" rel="prev" onclick={() => (open = false)}></button>
				<p>
					<strong>Edit tags</strong>
				</p>
			</header>
			<form>
				<label>
					<span>Label</span>
					<input type="text" bind:value={label} />
				</label>
				<label>
					<span>URL</span>
					<input type="text" bind:value={url} />
				</label>
				<button type="submit" onclick={() => saveCallback(label, url)}>Save</button>
				<button type="submit" class="secondary" onclick={() => saveCallback('', '')}>Delete</button>
			</form>
		</article>
	</dialog>
{/if}
