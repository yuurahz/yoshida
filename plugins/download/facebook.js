/** Tqto
  - Kath (surya)
*/

module.exports = {
	help: ["facebook"],
	tags: ["downloader"],
	command: /^(facebook|fb)$/i,
	run: async (m, { API, Func, quoted }) => {
		if (!quoted.text)
			return m.reply(Func.example(m.prefix, m.command, "link"));
		if (!Func.isUrl(quoted.text)) return m.reply(mess.invalid);
		m.react("⏱️");
		try {
			const data = await Func.fetchJson(
				API("yosh", "/downloader/facebook", { url: quoted.text })
			);
			if (!data.status) {
				return m.reply(mess.wrong);
			}
			let caption = `- *${data.result.type === "video" ? "Video" : "Post"} Facebook.*\n`;
			caption += `- *Title:* ${data.result.title || "Facebook"}\n`;
			caption += `- *Source:* ${data.result.url}\n`;
			if (data.result.externalUrl) {
				caption += `- *External URL:* ${data.result.externalUrl}\n`;
			}
			if (
				data.result.comments &&
				Array.isArray(data.result.comments) &&
				data.result.comments.length > 0
			) {
				caption += "\n— *Top Comments:*\n";
				const topComments = data.result.comments.slice(0, 3);
				for (const comment of topComments) {
					if (comment.text && comment.text.trim() !== "") {
						caption += `- *${comment.author.name}:* ${comment.text}\n`;
					}
				}
			}
			if (
				data.result.type === "image" &&
				Array.isArray(data.result.image) &&
				data.result.image.length > 0
			) {
				for (let i = 0; i < data.result.image.length; i++) {
					const imageUrl = data.result.image[i];
					await m.reply({
						image: { url: imageUrl },
						caption: i === 0 ? caption.trim() : "",
					});
				}
				return;
			}
			if (
				data.result.type === "video" &&
				(data.result.hd || data.result.sd)
			) {
				const videoUrl = data.result.hd || data.result.sd;
				const quality = data.result.hd ? "HD" : "SD";
				const videoCaption = `- *Quality:* ${quality}\n` + caption;
				return m.reply({
					video: { url: videoUrl },
					caption: videoCaption.trim(),
				});
			}
		} catch (e) {
			console.log(e);
			return m.reply(mess.eror);
		}
	},
	limit: 1,
};
