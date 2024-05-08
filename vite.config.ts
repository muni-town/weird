import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from 'unocss/vite';
import extractorSvelte from '@unocss/extractor-svelte';

import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		UnoCSS({
			extractors: [extractorSvelte()]
		}),
		sveltekit()
	]
});
