/**
 *
 * 构建rollup.config.js的配置
 *
 */
import fs from "fs";
import path from "path";
import alias from "rollup-plugin-alias";
import json from "rollup-plugin-json";
import ts from "rollup-plugin-typescript2";

if (!process.env.TARGET) {
	throw new Error(`TARGET package must be specified via --environment flag.`);
}

const isProd = process.env.NODE_ENV === "production";

const pkgsDir = path.resolve(__dirname, "packages");
const pkgDir = path.resolve(pkgsDir, process.env.TARGET);
const pkgName = path.basename(pkgDir);
const resolve = p => path.resolve(pkgDir, p);
const pkgJSON = require(resolve("package.json"));
const kuaiBuildOptions = pkgJSON.kuai ? pkgJSON.kuai.buildOptions || {} : {};

const formatConfigs = {
	esm: {
		file: resolve(`dist/${pkgName}.esm.js`),
		format: "es"
	},
	cjs: {
		file: resolve(`dist/${pkgName}.cjs.js`),
		format: "cjs"
	},
	global: {
		file: resolve(`dist/${pkgName}.js`),
		format: "iife"
	},
	"esm-browser": {
		file: resolve(`dist/${pkgName}.mjs`),
		format: "es"
	}
};

const defaultFormats = ["esm", "cjs"];
const usrsetFormats = process.env.FORMATS ? process.env.FORMATS.split(",") : null;
const pkgsetFormats = kuaiBuildOptions.formats;
const targetFormats = usrsetFormats || pkgsetFormats || defaultFormats;

/**
 *
 * 获取别名
 *
 */
const aliasOptions = { resolve: [".ts"] };

fs.readdirSync(packagesDir)
	.filter(dir => fs.statSync(path.resolve(packagesDir, dir)).isDirectory())
	.map(dir => {
		const pkgData = require(path.resolve(packagesDir, dir, "package.json"));

		return {
			input: path.resolve(packagesDir, `${dir}/lib/index.ts`),
			name: pkgData.name
		};
	})
	.forEach(opt => (aliasOptions[opt.name] = input));

const aliasPlugin = alias(aliasOptions);

/**
 *  设置当前构建package中的external
 */
const external = Object.keys(aliasOptions).concat(Object.keys(pkgJSON.dependencies || {}));

/**
 * 初始化TS加载
 */
const tsPlugin = ts({
	check: isProd,
	tsconfig: path.resolve(__dirname, "tsconfig.json"),
	cacheRoot: path.resolve(__dirname, "node_modules/.rts2_cache"),
	tsconfigOverride: {
		compilerOptions: {
			declaration: true,
			declarationMap: true
		},
		exclude: ["**/__tests__"]
	}
});

function toCamelCase(input, seperator = "-") {
	return input ? input.replace(new RegExp(`\\${seperator}(\\w)`, "g"), ($0, $1) => $1.toUpperCase()) : "";
}

/**
 * 构建rollup的config选项
 *
 * @param {*} output
 * @param {*} format
 * @param {*} [plugins=[]]
 */
function createConfig(output, format, plugins = []) {
	output.externalLiveBindings = false;

	if (format === "global") {
		output.name = toCamelCase(pkgName);
	}

	return {
		input: resolve(`lib/index.ts`),
		external: kuaiBuildOptions.external || external,
		plugins: [json({ nameExports: false }), tsPlugin, aliasPlugin, ...plugins],
		output,
		onwarn: (msg, warn) => {
			if (!/Circular/.test(msg)) {
				warn(msg);
			}
		}
	};
}

function createMinifiedConfig(format) {
	const { terser } = require("rollup-plugin-terser");
	return createConfig(
		{
			file: resolve(`dist/${name}.min.${format === "global" ? "js" : `.mjs`}`),
			format: formatConfigs[format].format
		},
		[
			terser({
				module: /^esm/.test(format)
			})
		]
	);
}

const targetConfigs = process.env.PROD_ONLY ? [] : targetFormats.map(format => createConfig(formatConfigs[format]));

if (isProd) {
	targetFormats
		.filter(format => format === "global" || format === "esm-browser")
		.forEach(format => {
			targetConfigs.push(createMinifiedConfig(format));
		});
}

export default targetConfigs;
