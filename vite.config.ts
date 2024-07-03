import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [wasm(), topLevelAwait(), sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 9523,
		strictPort: true
	}
});
