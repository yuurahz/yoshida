const { toAudio, toPTT } = require("@library/converter");

module.exports = {
  help: ["toaudio"],
  tags: ["converter"],
  command: /^to(mp3|audio|vn|ptt)$/i,
  run: async (m, { Func, conn, quoted }) => {
    let mime = (quoted.msg || quoted).mimetype || "";
    if (/mp3|a(udio)?$/i.test(m.command)) {
      if (!/video|audio/.test(mime))
        return m.reply(Func.texted("bold", "Reply video."));
      m.react("⏱️");
      let media = await quoted.download();
      if (!media) return m.reply(mess.wrong);
      let audio = await toAudio(media, "mp4");
      if (!audio.data) return m.reply(mess.wrong);
      m.reply({ audio: audio.data, mimetype: "audio/mpeg" });
    }
    if (/vn|ptt$/i.test(m.command)) {
      if (!/video|audio/.test(mime))
        return m.reply(Func.texted("bold", "Reply video."));
      m.react("⏱️");
      let media = await quoted.download();
      if (!media) return m.reply(mess.wrong);
      let audio = await toPTT(media, "mp4");
      if (!audio.data) return m.reply(mess.wrong);
      m.reply({ audio: audio.data, ptt: true });
    }
  },
  limit: 1,
};
