module.exports = {
	help: ["setcover"],
	tags: ["owner"],
	command: /^(setcover)$/i,
	run: async (m, { Func, quoted, setting }) => {
		try {
			let mime = (quoted.msg || quoted).mimetype || "";
			if (!/image\/(jpe?g|png)/.test(mime))
				return m.reply(Func.texted("bold", "Reply photo."));
			let img = await quoted.download();
			if (!img) return m.reply(mess.wrong);
			let json = await upload.catbox(img);
			setting.cover = json;
			m.reply("Cover successfully changed");
		} catch (e) {
			return m.reply(Func.jsonFormat(e));
		}
	},
	owner: true,
};
