const fs = require("node:fs");
const path = require("node:path");
const chokidar = require("chokidar");
const pluginFolder = path.join(process.cwd(), "plugins");
let plugins = {};

function loadPlugins() {
	const files = fs.readdirSync(pluginFolder);
	files.forEach((file) => {
		const filePath = path.join(pluginFolder, file);
		if (fs.statSync(filePath).isDirectory()) {
			loadPluginsInDir(filePath);
		} else if (file.endsWith(".js")) {
			try {
				const plugin = require(filePath);
				plugins[file] = plugin;
			} catch (error) {
				console.error(`Error loading plugin ${file}: ${error}`);
			}
		}
	});
}

function loadPluginsInDir(dirPath) {
	const files = fs.readdirSync(dirPath);
	files.forEach((file) => {
		const filePath = path.join(dirPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			loadPluginsInDir(filePath);
		} else if (file.endsWith(".js")) {
			try {
				const plugin = require(filePath);
				plugins[file] = plugin;
			} catch (error) {
				console.error(`Error loading plugin ${file}: ${error}`);
			}
		}
	});
}

function watchPlugins() {
	chokidar
		.watch(pluginFolder, {
			persistent: true,
			ignoreInitial: true,
		})
		.on("add", (filePath) => {
			reloadPlugin(filePath);
		})
		.on("change", (filePath) => {
			reloadPlugin(filePath);
		})
		.on("unlink", (filePath) => {
			const fileName = path.basename(filePath);
			delete plugins[fileName];
			console.log(`Plugin ${fileName} removed`);
		});
}

function reloadPlugin(filePath) {
	try {
		delete require.cache[require.resolve(filePath)];
		const plugin = require(filePath);
		const fileName = path.basename(filePath);
		plugins[fileName] = plugin;
		console.log(`Plugin ${fileName} reloaded`);
	} catch (error) {
		console.error(`Error reloading plugin ${filePath}: ${error}`);
	}
}

module.exports = {
	plugins,
	loadPlugins,
	watchPlugins,
};
