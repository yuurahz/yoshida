module.exports = {
  help: ["tiktok", "tiktokaudio"],
  tags: ["downloader"],
  command: /^(tiktok|tt|tiktokaudio|tiktokmp3|ttaudio|ttmp3)$/i,
  run: async (m, { API, Func, quoted }) => {
    if (!quoted.text) return m.reply(Func.example(m.prefix, m.command, "link"));
    if (!Func.isUrl(quoted.text)) return m.reply(mess.invalid);
    m.react("⏱️");
    try {
      if (m.command === "tt" || m.command === "tiktok") {
        const getRes = await Func.fetchJson(
          API("yosh", "/downloader/tiktok", { url: quoted.text }),
        );
        const { data } = getRes.result;
        if (data.images) {
          let c = 0,
            d = data.images.length;
          for (let i of data.images) {
            if (c == 0)
              await m.reply({
                image: { url: i },
                caption: `- Author : ${data.author.nickname}\n- Views : ${Func.formatNumber(data.play_count)}\n- Likes : ${Func.formatNumber(data.digg_count)}\n- Comment : ${Func.formatNumber(data.comment_count)}\n- Caption : ${data.title}`,
              });
            else await m.reply({ image: { url: i } });
            c += 1;
            await Func.delay(3000);
          }
        } else {
          await m.reply({
            video: { url: data.play },
            caption: `- Author : ${data.author.nickname}\n- Views : ${Func.formatNumber(data.play_count)}\n- Likes : ${Func.formatNumber(data.digg_count)}\n- Comment : ${Func.formatNumber(data.comment_count)}\n- Caption : ${data.title}`,
          });
        }
      } else if (
        m.command === "tiktokmp3" ||
        m.command === "tiktokaudio" ||
        m.command === "ttmp3" ||
        m.command === "ttaudio"
      ) {
        const getAudio = await Func.fetchJson(
          API("yosh", "/downloader/tiktok", { url: quoted.text }),
        );
        const { data } = getAudio.result;
        await m.reply({
          audio: { url: data.music },
          mimetype: "audio/mpeg",
          contextInfo: {
            externalAdReply: {
              title: data.music_info.title,
              body: data.music_info.author,
              thumbnailUrl: data.music_info.cover,
              sourceUrl: quoted.text,
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      }
    } catch (e) {
      console.log(e);
      return m.reply(mess.eror);
    }
  },
  limit: 1,
};
