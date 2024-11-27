/// <reference types="vitest" />

import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import commonjs from '@rollup/plugin-commonjs';

import { defineConfig, searchForWorkspaceRoot } from 'vite';

export default defineConfig({
	plugins: [commonjs(), wasm(), topLevelAwait(), sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 9523,
		strictPort: true,
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())]
		}
	},
	build: {
		rollupOptions: {
			external: 'sharp'
		}
	},
	test: {
		include: ['./src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		watch: false
	}
});
