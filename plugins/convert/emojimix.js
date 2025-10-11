const { makeSticker } = require("@library/sticker");

module.exports = {
	help: ["emojimix"],
	tags: ["converter"],
	command: /^(emojimix|emix)$/i,
	run: async (m, { Func, setting }) => {
		if (!m.text) return m.reply(Func.example(m.prefix, m.command, "🤐+🥲"));
		m.react("⏱️");
		try {
			let [emoji1, emoji2] = m.text.split`+`;
			let rs = emoji1;
			let lo = emoji2;
			let sl = await Func.fetchJson(
				`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${rs}_${lo}`
			);
			let sel = sl.results[0];
			await makeSticker(await Func.fetchBuffer(sel.url), {
				pack: setting.stick_pack,
				author: setting.stick_auth,
			}).then((v) => {
				m.reply({ sticker: v });
			});
		} catch (e) {
			console.log(e);
			return m.reply(
				Func.texted(
					"bold",
					"emoji tidak support, silahkan ganti salah satu emoji atau ubah posisi emojinya."
				)
			);
		}
	},
	limit: 1,
};
