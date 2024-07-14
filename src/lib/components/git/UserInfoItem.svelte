<script lang="ts">
	export let label: string;
	export let href: string = '';
</script>

<a
	href={href || '#'}
	target={href ? '_blank' : '_self'}
	class="flex items-center space-x-2 text-gray-600 dark:text-gray-300"
>
	<slot />
	<p class="">{label}</p>
</a>
