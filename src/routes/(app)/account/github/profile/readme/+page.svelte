<script lang="ts">
	import snarkdown from 'snarkdown';
	export let data;
</script>

<div class="markdown mx-auto max-w-2xl overflow-x-auto px-4 py-12">
	{@html snarkdown(data.repo)}
</div>
