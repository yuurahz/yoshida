module.exports = {
  command: /^(setlink)$/i,
  run: async (m, { Func, setting }) => {
    if (!m.text)
      return m.reply(Func.example(m.prefix, m.command, setting.link));
    if (!Func.isUrl(m.text))
      return m.reply(Func.texted("bold", `URL is invalid.`));
    try {
      setting.link = m.text;
      m.reply(Func.texted("bold", `Link successfully set.`));
    } catch (e) {
      m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
