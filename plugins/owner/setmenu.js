module.exports = {
  help: ["setmenu"],
  tags: ["owner"],
  command: /^(setmenu)$/i,
  run: async (m, { Func, setting }) => {
    try {
      if (!m.text) return m.reply(Func.example(m.prefix, m.command, "2"));
      m.reply(`Successfully use styles *${m.text}*.`).then(
        () => (setting.style = parseInt(m.text)),
      );
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
