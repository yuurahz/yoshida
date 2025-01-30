module.exports = {
  command: /^(setwm)$/i,
  run: async (m, { Func, setting }) => {
    try {
      if (!m.text)
        return m.reply(
          Func.example(m.prefix, m.command, "Sticker by | © yoshida-bot"),
        );
      let [packname, ...author] = m.text.split`|`;
      author = (author || []).join`|`;
      setting.stick_pack = packname || "";
      setting.stick_auth = author || "";
      m.reply(mess.done);
    } catch (e) {
      m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
