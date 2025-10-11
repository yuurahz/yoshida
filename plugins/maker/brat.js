const { makeSticker } = require("@library/sticker");

module.exports = {
	help: ["brat"],
	tags: ["maker"],
	command: /^(brat|stext|stickertext|bratvid)$/i,
	run: async (m, { API, Func, setting, quoted }) => {
		try {
			if (!quoted.text)
				return m.reply(
					`*~ Example:* ${m.prefix + m.command} *text*\n\n*options:*\n*${m.prefix + m.command} text*\n> create a ${m.command} with text (no animated)\n*${m.prefix + m.command} text -animate*\n> create a ${m.command} with animated text`
				);
			m.react("⏱️");
			const isCmd = m.command === "bratvid";
			if (isCmd || quoted.text.endsWith("-animate")) {
				const make = isCmd
					? quoted.text
					: quoted.text.split("-animate")[0].trim();
				await makeSticker(
					await Func.fetchBuffer(
						API("yosh", "/maker/brat", {
							text: make,
							type: "animate",
						})
					),
					{
						pack: setting.stick_pack,
						author: setting.stick_auth,
					}
				).then((v) => {
					m.reply({ sticker: v });
				});
			} else if (quoted.text) {
				await makeSticker(
					await Func.fetchBuffer(
						API("yosh", "/maker/brat", { text: quoted.text })
					),
					{
						pack: setting.stick_pack,
						author: setting.stick_auth,
					}
				).then((v) => {
					m.reply({ sticker: v });
				});
			}
		} catch (e) {
			console.log(e);
			return m.reply(mess.wrong);
		}
	},
	limit: 1,
};
