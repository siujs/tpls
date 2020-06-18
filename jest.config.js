module.exports = {
	rootDir: ".",
	globals: {
		"ts-jest": {
			tsConfig: "tsconfig.json"
		}
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest"
	},
	coverageDirectory: "./coverage",
	coverageReporters: ["html"],
	testMatch: ["**/__tests__/**/*.(test|spec).(ts|js)"]
};
