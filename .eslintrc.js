module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"indent": ["error", 4, {"SwitchCase": 1, "ignoredNodes": ["PropertyDefinition"]}],
		"semi": ["error", "always"],
		"@typescript-eslint/no-inferrable-types": 0,
		"@typescript-eslint/no-non-null-assertion": 0,
		"keyword-spacing": ["warn", {"before": true, "after": true}],
		"space-before-blocks": "warn"
	},
	"ignorePatterns": [".eslintrc.js"],
}
