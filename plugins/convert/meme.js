const { makeSticker } = require("@library/sticker");

module.exports = {
  help: ["smeme"],
  tags: ["converter"],
  command: /^(smeme|stickermeme)$/i,
  run: async (m, { conn, quoted, Func, setting }) => {
    try {
      if (!m.text)
        return m.reply(Func.example(m.prefix, m.command, "Hi | Dude"));
      let [top, bottom] = m.text.split`|`;
      let mime = (quoted.msg || quoted).mimetype || "";
      if (!mime) return m.reply(Func.texted("bold", `Reply photo.`));
      if (!/webp|image\/(jpe?g|png)/.test(mime))
        return m.reply(
          Func.texted(
            "bold",
            `Media is not supported, can only be pictures and stickers.`,
          ),
        );
      let img = await quoted.download();
      let link = await upload.tmpfiles(img);
      let meme = `https://api.memegen.link/images/custom/${encodeURIComponent(top ? top : " ")}/${encodeURIComponent(bottom ? bottom : "")}.png?background=${link}&font=impact`;
      await makeSticker(await Func.fetchBuffer(meme), {
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
