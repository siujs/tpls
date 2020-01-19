// const path = require("path");
module.exports = {
	rollup(dir, format, config) {
		/**
		 *
		 * Demo:
		 *
		 *    // 设置rollup入口文件
		 * 	  config.input()
		 *
		 * 	  // 设置external参数
		 * 		config.external.add("")
		 *    config.external.delete("")
		 *
		 *    // 设置plugin
		 *    config.plugin("ts").use(ts,[{...tsOptions}])
		 *
		 *    // 设置output
		 *
		 *    config.output("browser"|"browserESM"|"main"|"module")
		 * 				.file()
		 * 				.format()
		 * 				.name()
		 * 				.globals.set("","")	 // .globals.delete("")
		 *
		 *    支持链式操作
		 *		 config.input().external.add().end().plugin().use().end().output().file().end().end()
		 */
	}
};
