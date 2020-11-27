import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const pkgDirs = fs.readdirSync(path.resolve(process.cwd(), "./packages"));

let unitTestModules = "";
if (process.argv.length > 2) {
	const dirs = process.argv.slice(2).filter(p => pkgDirs.includes(p));
	unitTestModules = dirs.join(",");
}

execSync(`cross-env UT_MDUS=${unitTestModules} jest --coverage --color=always`);
