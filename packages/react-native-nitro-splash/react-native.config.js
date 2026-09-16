module.exports = {
	dependency: {
		platforms: {
			ios: {
				podspecPath: "./Nitrosplash.podspec",
			},
			android: {
				sourceDir: "./android",
				packageImportPath: "import com.nitrosplash.NitrosplashPackage;",
			},
		},
	},
};
