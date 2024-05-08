// uno.config.ts
import { defineConfig, presetAttributify, presetTypography, presetUno } from 'unocss';
import presetWind from '@unocss/preset-wind';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
	presets: [
		presetAttributify(), // required when using attributify mode
		presetUno(), // required
		presetWind(),
		presetTypography()
	],
	transformers: [transformerDirectives()],
	rules: []
});
