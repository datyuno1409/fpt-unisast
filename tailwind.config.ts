import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./src/**/*.{ts,tsx}', './index.html'],
	theme: {
		extend: {
			fontFamily: {
				montserrat: ['Montserrat', 'sans-serif'],
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-in-out',
			},
		},
	},
	important: true,
	plugins: [],
};

export default config;
