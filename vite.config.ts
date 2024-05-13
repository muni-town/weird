import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';

import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [wasm(), sveltekit()]
});
