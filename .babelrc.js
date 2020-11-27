module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				useBuiltIns: "usage",
				corejs: {
					version: 3,
					proposals: true // 使用尚在“提议”阶段特性的 polyfill
				}
			}
		]
	],
	plugins: [
		"@babel/proposal-object-rest-spread",
		"@babel/proposal-optional-chaining",
		"@babel/proposal-nullish-coalescing-operator",
		["@babel/proposal-decorators", { legacy: true }],
		["@babel/proposal-class-properties", { loose: true }]
	]
};
