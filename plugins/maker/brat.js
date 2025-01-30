const { makeSticker } = require("@library/sticker");

module.exports = {
  help: ["brat"],
  tags: ["maker"],
  command: /^(brat|stext|stickertext)$/i,
  run: async (m, { Func, quoted, setting }) => {
    try {
      if (!quoted.text)
        return m.reply(
          `*~ Example:* ${m.prefix + m.command} halo\n\n*options:*\n*${m.prefix + m.command} <text> -animate*\n> create a ${m.command} with animation text`,
        );
      m.react("⏱️");
      if (quoted.text.endsWith("-animate")) {
        let make = quoted.text.split("-animate")[0].trim();
        await makeSticker(
          await Func.fetchBuffer(
            `https://brat.caliphdev.com/api/brat/animate?text=${encodeURIComponent(make)}`,
          ),
          {
            pack: setting.stick_pack,
            author: setting.stick_auth,
          },
        ).then((v) => {
          m.reply({ sticker: v });
        });
      } else if (quoted.text) {
        await makeSticker(
          await Func.fetchBuffer(
            `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(quoted.text)}`,
          ),
          {
            pack: setting.stick_pack,
            author: setting.stick_auth,
          },
        ).then((v) => {
          m.reply({ sticker: v });
        });
      }
    } catch (e) {
      return m.reply(e.toString());
    }
  },
  limit: 1,
};
