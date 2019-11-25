/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 *
 * 构建rollup.config.js的配置
 *
 */
import fs from "fs";
import path from "path";
import nodeResolve from "rollup-plugin-node-resolve";
import alias from "rollup-plugin-alias";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import ts from "rollup-plugin-typescript2";
import babel from "./scripts/babel.custom";

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
		exclude: ["**/__tests__", "packages/global.d.ts"]
	}
});

const jsonPlugin = json({
	namedExports: false
});

const nodeResolvePlugin = nodeResolve({
	mainFields: ["module", "jsnext", "main"]
});

const commonjsPlugin = commonjs({
	include: /\/node_modules\//
});

/**
 *
 * 获取别名
 *
 */
const aliasOptions = { resolve: [".ts"] };

fs.readdirSync(pkgsDir)
	.filter(dir => fs.statSync(path.resolve(pkgsDir, dir)).isDirectory())
	.map(dir => {
		const pkgData = require(path.resolve(pkgsDir, dir, "package.json"));

		return {
			input: path.resolve(pkgsDir, `${dir}/lib/index.ts`),
			name: pkgData.name
		};
	})
	.forEach(opt => (aliasOptions[opt.name] = opt.input));

const aliasPlugin = alias(aliasOptions);

/**
 *  设置当前构建package中的external
 */
const defaultExternal = Object.keys(aliasOptions).concat(Object.keys(pkgJSON.dependencies || {}));

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

	const rollupPlugins = [
		jsonPlugin,
		tsPlugin,
		nodeResolvePlugin,
		commonjsPlugin,
		aliasPlugin,
		format === "global" &&
			babel({
				extensions: [".ts", ".tsx", ".js", ".jsx", ".es6", ".es", ".mjs"],
				exclude: "node_modules/**",
				passPerPreset: true, // @see https://babeljs.io/docs/en/options#passperpreset
				custom: {
					modern: false,
					compress: false,
					targets: undefined,
					typescript: true
				}
			}),
		...plugins
	].filter(Boolean);

	const kuaiExternals = Object.keys(kuaiBuildOptions.external || {})
		.filter(p => ~p.indexOf(format))
		.map(it => kuaiBuildOptions.external[it])
		.flatMap(x => x);

	if ((format === "esm-browser" || format === "global") && kuaiBuildOptions.globals) {
		output.globals = kuaiBuildOptions.globals;
	}

	output.exports = "named";

	return {
		input: resolve(`lib/index.ts`),
		external: (format === "esm-browser" || format === "global" ? [] : defaultExternal).concat(kuaiExternals),
		plugins: rollupPlugins,
		output,
		onwarn: (msg, warn) => {
			if (!/Circular/.test(msg)) {
				warn(msg);
			}
		}
	};
}

/**
 * 针对global和esm-browser浏览器环境的包对应的rollup配置
 *
 * @param {*} format
 * @returns
 */
function createMinifiedConfig(format) {
	const { terser } = require("rollup-plugin-terser");
	const gzip = require("rollup-plugin-gzip").default;

	return createConfig(
		{
			file: resolve(`dist/${pkgName}.min.${format === "global" ? "js" : `mjs`}`),
			format: formatConfigs[format].format
		},
		format,
		[
			terser({
				// module: /^esm/.test(format)
				include: [/^.+\.min\.m?js$/],
				sourcemap: true,
				compress: {
					keep_infinity: true,
					pure_getters: true,
					// Ideally we'd just get Terser to respect existing Arrow functions...
					// unsafe_arrows: true,
					passes: 10
				},
				output: {
					// By default, Terser wraps function arguments in extra parens to trigger eager parsing.
					// Whether this is a good idea is way too specific to guess, so we optimize for size by default:
					wrap_func_args: false
				},
				warnings: true,
				mangle: {}
			}),
			gzip({ minSize: 10240 })
		]
	);
}

const defaultFormats = ["esm", "cjs"];

const targetFormats = kuaiBuildOptions.formats || defaultFormats;

const targetConfigs = kuaiBuildOptions.prodOnly
	? []
	: targetFormats.map(format => createConfig(formatConfigs[format], format));

targetFormats
	.filter(format => format === "global" || format === "esm-browser")
	.forEach(format => {
		targetConfigs.push(createMinifiedConfig(format));
	});

export default targetConfigs;
