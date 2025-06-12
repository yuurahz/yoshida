module.exports = {
  help: ["setmsg"],
  tags: ["owner"],
  command: /^(setmsg)$/i,
  run: async (m, { Func, setting }) => {
    try {
      if (!m.text) return m.reply(explain(m.prefix, m.command));
      setting.msg = m.text;
      m.reply(Func.texted("bold", `Menu Message successfully set.`));
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};

const explain = (prefix, command) => {
  return `Sorry, can't return without text, and this explanation and how to use :

*1.* +tag : for mention sender.
*2.* +greeting : to display greetings by time.
*3.* +database : to display database systems currently in use.

~ *Example* : ${prefix + command} Hi +tag +greeting, i'm an automation system`;
};
