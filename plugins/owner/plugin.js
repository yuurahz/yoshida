module.exports = {
	help: ["plugen", "plugdis"],
	tags: ["owner"],
	command: /^(plugen|plugdis)$/i,
	run: async (m, { Func, setting, plugins }) => {
		if (!m.args || !m.args[0])
			return m.reply(Func.example(m.prefix, m.command, "tiktok"));
		const pluginName = m.args[0].toLowerCase();
		const pluginFile = Object.keys(plugins).find((key) => {
			const fileName = key
				.split("/")
				.pop()
				.replace(".js", "")
				.toLowerCase();
			return fileName === pluginName;
		});
		if (!pluginFile)
			return m.reply(
				Func.texted("bold", `Plugin ${pluginName}.js not found.`)
			);
		const fileName = pluginFile.split("/").pop();
		if (setting.pluginDisable.includes(fileName)) {
			if (m.command === "plugdis") {
				return m.reply(
					Func.texted(
						"bold",
						`Plugin ${fileName} is already disabled.`
					)
				);
			}
		}
		if (m.command === "plugdis") {
			if (!setting.pluginDisable.includes(fileName)) {
				setting.pluginDisable.push(fileName);
				m.reply(
					Func.texted(
						"bold",
						`Plugin ${fileName} successfully disabled.`
					)
				);
			} else {
				return m.reply(
					Func.texted(
						"bold",
						`Plugin ${fileName} is already disabled.`
					)
				);
			}
		} else if (m.command === "plugen") {
			if (setting.pluginDisable.includes(fileName)) {
				setting.pluginDisable = setting.pluginDisable.filter(
					(plugin) => plugin !== fileName
				);
				m.reply(
					Func.texted(
						"bold",
						`Plugin ${fileName} successfully enabled.`
					)
				);
			} else {
				return m.reply(
					Func.texted("bold", `Plugin ${fileName} is not disabled.`)
				);
			}
		}
	},
	owner: true,
};
