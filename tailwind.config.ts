import { join } from 'path';
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
// 1. Import the Skeleton plugin
import { skeleton } from '@skeletonlabs/tw-plugin';

import { weirdTheme } from './skeleton-themes';

const config = {
	// 2. Opt for dark mode to be handled via the class method
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		// 3. Append the path to the Skeleton package
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			fontFamily: {
				uncut: ['Uncut Sans'],
				rubik: ['Rubik Mono One'],
				spacemono: ['Space Mono']
			}
		}
	},
	plugins: [
		typography,
		forms,
		// 4. Append the Skeleton plugin (after other plugins)
		skeleton({
			themes: { custom: [weirdTheme] }
		})
	]
} satisfies Config;

export default config;
