const jimp = require("jimp");

module.exports = {
	help: ["blur"],
	tags: ["converter"],
	command: /^(blur|buram)$/i,
	run: async (m, { Func, quoted }) => {
		let mime = (quoted.msg || quoted).mimetype || "";
		if (!mime) return m.reply(Func.texted("bold", `Reply photo.`));
		if (!/webp|image\/(jpe?g|png)/.test(mime))
			return m.reply(
				Func.texted(
					"bold",
					`Media is not supported, can only be pictures and stickers.`
				)
			);
		m.react("⏱️");
		let image = await quoted.download();
		let level = m.text || "5",
			img = await jimp.read(image);
		img.blur(isNaN(level) ? 5 : parseInt(level));
		img.getBuffer("image/jpeg", (e, buffer) => {
			if (e) return m.reply(mess.wrong);
			m.reply({ image: buffer });
		});
	},
	limit: 1,
};
