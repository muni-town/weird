<script lang="ts">
	import type { GitRepo } from '$lib/types/git';

	export let repo: GitRepo;
</script>

<article class={`rounded-md border  border-gray-300 p-4 dark:border-gray-700`}>
	<div class={`flex items-center justify-between`}>
		<a
			target="_blank"
			href={repo.html_url}
			class={`block flex-1 font-bold text-blue-500 hover:underline dark:text-blue-400`}
		>
			{repo.name}
		</a>

		<p
			class={`rounded-full border border-gray-300 px-2 py-1 text-xs font-semibold capitalize dark:border-gray-700`}
		>
			{repo.visibility}
		</p>
	</div>

	<p class={`mt-4 text-sm text-gray-600 dark:text-gray-400`}>{repo.description}</p>

	<div class={`mt-4 flex items-center space-x-4`}>
		<div>
			<p class={`text-sm font-medium text-gray-600 dark:text-gray-400`}>{repo.language}</p>
		</div>
		<div class={`flex items-center space-x-2`}>
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					width="16"
					height="16"
					fill="gray"
				>
					<path
						fill-rule="evenodd"
						d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
					></path>
				</svg>
			</div>
			<p class={`text-xs text-gray-600 dark:text-gray-300`}>{repo.stargazers_count}</p>
		</div>
		<div class={`flex items-center space-x-2`}>
			<div>
				<svg
					aria-label="forks"
					role="img"
					height="16"
					viewBox="0 0 16 16"
					version="1.1"
					width="16"
					data-view-component="true"
					fill="gray"
				>
					<path
						fill-rule="evenodd"
						d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
					></path>
				</svg>
			</div>
			<p class={`text-xs text-gray-600 dark:text-gray-300`}>{repo.forks_count}</p>
		</div>
	</div>
</article>
