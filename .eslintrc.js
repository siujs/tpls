module.exports = {
	parser: "@typescript-eslint/parser",
	extends: [
		"plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
		"prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
		"plugin:prettier/recommended" // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	plugins: ["@typescript-eslint", "prettier"],
	rules: {
		"@typescript-eslint/no-var-requires": 1,
		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/camelcase": 1,
		"prefer-rest-params": 1,
		"no-var": 1
	}
};
