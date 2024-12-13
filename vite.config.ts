import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import path from 'path';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
export default defineConfig({
	plugins: [react()],

	build: {
		emptyOutDir: true,
		cssCodeSplit: false,
		outDir: 'templates',
	},

	server: {
		host: '0.0.0.0',
		proxy: {
			'/api': 'http://localhost:5000',
		},
	},

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	css: {
		postcss: {
			plugins: [tailwindcss(), autoprefixer()],
		},
	},
});
