<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<pre>
{JSON.stringify(data.info, null, 2)}
</pre>
