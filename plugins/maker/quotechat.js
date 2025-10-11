const axios = require("axios");
const { makeSticker } = require("@library/sticker");

module.exports = {
	help: ["fakechat"],
	tags: ["maker"],
	command: /^(fakechat|quotechat|qc)$/i,
	run: async (m, { conn, Func, quoted, setting }) => {
		const colors = {
			pink: "#f68ac9",
			blue: "#6cace4",
			red: "#f44336",
			green: "#4caf50",
			yellow: "#ffeb3b",
			purple: "#9c27b0",
			darkblue: "#0d47a1",
			lightblue: "#03a9f4",
			grey: "#9e9e9e",
			orange: "#ff9800",
			black: "#000000",
			white: "#ffffff",
			teal: "#008080",
			lightred: "#FFC0CB",
			brown: "#A52A2A",
			salmon: "#FFA07A",
			magenta: "#FF00FF",
			tan: "#D2B48C",
			wheat: "#F5DEB3",
			deeppink: "#FF1493",
			fire: "#B22222",
			skyblue: "#00BFFF",
			brightorange: "#FF7F50",
			lightskyblue: "#1E90FF",
			hotpink: "#FF69B4",
			skybluegreen: "#87CEEB",
			seagreen: "#20B2AA",
			darkred: "#8B0000",
			redorange: "#FF4500",
			cyan: "#48D1CC",
			darkpurple: "#BA55D3",
			mossgreen: "#00FF7F",
			darkgreen: "#008000",
			midnightblue: "#191970",
			darkorange: "#FF8C00",
			blackishpurple: "#9400D3",
			fuchsia: "#FF00FF",
			darkmagenta: "#8B008B",
			darkgrey: "#2F4F4F",
			peachpuff: "#FFDAB9",
			darkcrimson: "#DC143C",
			goldenrod: "#DAA520",
			gold: "#FFD700",
			silver: "#C0C0C0",
		};
		let [color, ...message] = quoted.text.split(" ");
		message = message.join(" ") || quoted.text;
		if (!quoted.text)
			return m.reply(
				`*Input text.*\nExample: ${m.prefix + m.command} white halo\n\n*List color:*\n${Object.keys(colors).join("\n- ")}`
			);
		m.react("⏱️");
		try {
			const avatar = await conn
				.profilePictureUrl(quoted.sender, "image")
				.catch((_) => "https://files.catbox.moe/ka3kec.jpg");
			m.react("⏱️");
			const json = {
				type: "quote",
				format: "png",
				backgroundColor: colors[color] || "#0C0C0C",
				width: 512,
				height: 768,
				scale: 2,
				messages: [
					{
						entities: [],
						avatar: true,
						from: {
							id: 1,
							name: quoted.name,
							photo: {
								url: avatar,
							},
						},
						text: message,
						replyMessage: {},
					},
				],
			};
			const response = await axios.post(
				"https://bot.lyo.su/quote/generate",
				json,
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			const buffer = Buffer.from(response.data.result.image, "base64");
			await makeSticker(buffer, {
				pack: setting.stick_pack,
				author: setting.stick_auth,
				keepScale: true,
			}).then((v) => {
				m.reply({ sticker: v });
			});
		} catch (e) {
			console.log(e);
			return m.reply(mess.wrong);
		}
	},
	limit: 1,
};
