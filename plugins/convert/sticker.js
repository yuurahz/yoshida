const { makeSticker } = require("@library/sticker");

module.exports = {
	help: ["sticker"],
	tags: ["converter"],
	command: /^s(ti(c?k(er(gif)?)?|c)|gif)?$/i,
	run: async (m, { Func, conn, quoted, setting }) => {
		try {
			let mime = (quoted.msg || quoted).mimetype || "";
			if (/image\/(jpe?g|png)/.test(mime)) {
				let img = await quoted.download();
				if (!img) return m.reply(mess.wrong);
				return await makeSticker(img, {
					pack: setting.stick_pack,
					author: setting.stick_auth,
					circle: m.text.includes("-circle"),
					keepScale: m.text.includes("-crop") ? false : true,
				}).then((v) => {
					m.reply({ sticker: v });
				});
			} else if (/video/.test(mime)) {
				if ((quoted.msg || quoted).seconds > 7)
					return m.reply(
						Func.texted("bold", `Maximum duration 7 seconds.`)
					);
				let img = await quoted.download();
				if (!img) return m.reply(mess.wrong);
				return await makeSticker(img, {
					pack: setting.stick_pack,
					author: setting.stick_auth,
					keepScale: true,
				}).then((v) => {
					m.reply({ sticker: v });
				});
			} else if (
				/(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mp4))/i.test(quoted.text)
			) {
				const buffer = await Func.fetchBuffer(
					Func.isUrl(quoted.text)[0]
				);
				return await makeSticker(buffer, {
					pack: setting.stick_pack,
					author: setting.stick_auth,
					keepScale: true,
				}).then((v) => {
					m.reply({ sticker: v });
				});
			} else
				m.reply(
					`*Reply pesan media/gambar/video/gif.*\n\n*options :*\n*${m.prefix + m.command} -circle*\n> membuat sticker menjadi lingkaran.\n*${m.prefix + m.command} -crop*\n> membuat sticker dengan ukuran persegi.`
				);
		} catch (e) {
			console.log(e);
			return m.reply(mess.wrong);
		}
	},
	limit: 1,
};
