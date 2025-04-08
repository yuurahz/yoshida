const axios = require("axios");

module.exports = {
  help: ["tiktok", "tiktokaudio"],
  tags: ["downloader"],
  command: /^(tiktok|tt|tiktokaudio|tiktokmp3|ttaudio|ttmp3)$/i,
  run: async (m, { Func, quoted }) => {
    if (!quoted.text) return m.reply(Func.example(m.prefix, m.command, "link"));
    if (!Func.isUrl(quoted.text)) return m.reply(mess.invalid);
    m.react("⏱️");
    try {
      if (m.command === "tt" || m.command === "tiktok") {
        let getRes = await tiktok(quoted.text);
        let { data } = getRes;
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
        let tete = await tiktok(quoted.text);
        let { data } = tete;
        await m.reply({
          audio: { url: data.music },
          mimetype: "audio/mpeg",
          contextInfo: {
            externalAdReply: {
              showAdAttribution: true,
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

const tiktok = async (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      const encodedParams = new URLSearchParams();
      encodedParams.set("url", query);
      encodedParams.set("hd", "1");
      const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "current_language=en",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        },
        data: encodedParams,
      });
      const videos = response.data;
      resolve(videos);
    } catch (e) {
      reject(e);
    }
  });
};
