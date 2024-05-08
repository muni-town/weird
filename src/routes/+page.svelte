<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="heading">Key Info</h1>

<pre>
    {JSON.stringify(data.key_info)}
</pre>
