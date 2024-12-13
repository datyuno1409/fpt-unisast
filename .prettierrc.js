/** @type {import('prettier').Config} */
const config = {
	jsxSingleQuote: true,
	plugins: ['prettier-plugin-tailwindcss'],
	singleQuote: true,
	tabWidth: 4,
	tailwindConfig: './tailwind.config.ts',
	trailingComma: 'all',
	useTabs: true,
	vueIndentScriptAndStyle: true,
};

export default config;
