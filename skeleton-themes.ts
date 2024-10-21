import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const weirdTheme: CustomThemeConfig = {
	name: 'weird',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `system-ui`,
		'--theme-font-family-heading': `system-ui`,
		'--theme-font-color-base': '0 0 0',
		'--theme-font-color-dark': '255 255 255',
		'--theme-rounded-base': '24px',
		'--theme-rounded-container': '12px',
		'--theme-border-base': '2px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '0 0 0',
		'--on-secondary': '0 0 0',
		'--on-tertiary': '0 0 0',
		'--on-success': '0 0 0',
		'--on-warning': '0 0 0',
		'--on-error': '255 255 255',
		'--on-surface': '255 255 255',
		// =~= Theme Colors  =~=
		// primary | #b0a7e9
		'--color-primary-50': '243 242 252', // #f3f2fc
		'--color-primary-100': '239 237 251', // #efedfb
		'--color-primary-200': '235 233 250', // #ebe9fa
		'--color-primary-300': '223 220 246', // #dfdcf6
		'--color-primary-400': '200 193 240', // #c8c1f0
		'--color-primary-500': '176 167 233', // #b0a7e9
		'--color-primary-600': '158 150 210', // #9e96d2
		'--color-primary-700': '132 125 175', // #847daf
		'--color-primary-800': '106 100 140', // #6a648c
		'--color-primary-900': '86 82 114', // #565272
		// secondary | #fff5bf
		'--color-secondary-50': '255 254 245', // #fffef5
		'--color-secondary-100': '255 253 242', // #fffdf2
		'--color-secondary-200': '255 253 239', // #fffdef
		'--color-secondary-300': '255 251 229', // #fffbe5
		'--color-secondary-400': '255 248 210', // #fff8d2
		'--color-secondary-500': '255 245 191', // #fff5bf
		'--color-secondary-600': '230 221 172', // #e6ddac
		'--color-secondary-700': '191 184 143', // #bfb88f
		'--color-secondary-800': '153 147 115', // #999373
		'--color-secondary-900': '125 120 94', // #7d785e
		// tertiary | #e47689
		'--color-tertiary-50': '251 234 237', // #fbeaed
		'--color-tertiary-100': '250 228 231', // #fae4e7
		'--color-tertiary-200': '248 221 226', // #f8dde2
		'--color-tertiary-300': '244 200 208', // #f4c8d0
		'--color-tertiary-400': '236 159 172', // #ec9fac
		'--color-tertiary-500': '228 118 137', // #e47689
		'--color-tertiary-600': '205 106 123', // #cd6a7b
		'--color-tertiary-700': '171 89 103', // #ab5967
		'--color-tertiary-800': '137 71 82', // #894752
		'--color-tertiary-900': '112 58 67', // #703a43
		// success | #1adb64
		'--color-success-50': '221 250 232', // #ddfae8
		'--color-success-100': '209 248 224', // #d1f8e0
		'--color-success-200': '198 246 216', // #c6f6d8
		'--color-success-300': '163 241 193', // #a3f1c1
		'--color-success-400': '95 230 147', // #5fe693
		'--color-success-500': '26 219 100', // #1adb64
		'--color-success-600': '23 197 90', // #17c55a
		'--color-success-700': '20 164 75', // #14a44b
		'--color-success-800': '16 131 60', // #10833c
		'--color-success-900': '13 107 49', // #0d6b31
		// warning | #daa725
		'--color-warning-50': '249 242 222', // #f9f2de
		'--color-warning-100': '248 237 211', // #f8edd3
		'--color-warning-200': '246 233 201', // #f6e9c9
		'--color-warning-300': '240 220 168', // #f0dca8
		'--color-warning-400': '229 193 102', // #e5c166
		'--color-warning-500': '218 167 37', // #daa725
		'--color-warning-600': '196 150 33', // #c49621
		'--color-warning-700': '164 125 28', // #a47d1c
		'--color-warning-800': '131 100 22', // #836416
		'--color-warning-900': '107 82 18', // #6b5212
		// error | #a30f25
		'--color-error-50': '241 219 222', // #f1dbde
		'--color-error-100': '237 207 211', // #edcfd3
		'--color-error-200': '232 195 201', // #e8c3c9
		'--color-error-300': '218 159 168', // #da9fa8
		'--color-error-400': '191 87 102', // #bf5766
		'--color-error-500': '163 15 37', // #a30f25
		'--color-error-600': '147 14 33', // #930e21
		'--color-error-700': '122 11 28', // #7a0b1c
		'--color-error-800': '98 9 22', // #620916
		'--color-error-900': '80 7 18', // #500712
		// surface | #513cc8
		'--color-surface-50': '229 226 247', // #e5e2f7
		'--color-surface-100': '220 216 244', // #dcd8f4
		'--color-surface-200': '212 206 241', // #d4cef1
		'--color-surface-300': '185 177 233', // #b9b1e9
		'--color-surface-400': '133 119 217', // #8577d9
		'--color-surface-500': '81 60 200', // #513cc8
		'--color-surface-600': '73 54 180', // #4936b4
		'--color-surface-700': '61 45 150', // #3d2d96
		'--color-surface-800': '49 36 120', // #312478
		'--color-surface-900': '40 29 98' // #281d62
	}
};
