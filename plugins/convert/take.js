const { setExif } = require("@library/sticker");

module.exports = {
	help: ["swm"],
	tags: ["converter"],
	command: /^(swm|colong|take|wm)$/i,
	run: async (m, { Func, conn }) => {
		if (!m.isQuoted) return m.reply(Func.texted("bold", "Reply sticker."));
		let stiker = false;
		try {
			let [packname, ...author] = m.text.split("|");
			author = (author || []).join("|");
			let mime = m.quoted.msg.mimetype || "";
			if (!/webp/.test(mime))
				return m.reply(Func.texted("bold", "Reply Sticker."));
			let img = await m.quoted.download();
			stiker = await setExif(img, packname || "", author || "");
		} catch (e) {
			if (Buffer.isBuffer(e)) stiker = e;
		} finally {
			if (stiker) return m.reply({ sticker: stiker });
			else return m.reply(mess.wrong);
		}
	},
	limit: 1,
};
