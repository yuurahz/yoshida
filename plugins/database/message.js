const { proto } = require("baileys");

module.exports = {
  help: ["+msg", "-msg", "listmsg"],
  tags: ["database"],
  command: ["+msg", "-msg", "listmsg"],
  run: async (m, { Func }) => {
    if (m.command == "+msg") {
      let M = proto.WebMessageInfo;
      if (!m.isQuoted)
        return m.reply(Func.texted("bold", "Reply message using commands"));
      if (!m.text) return m.reply(Func.example(m.prefix, m.command, "halo"));
      let msgs = db.msgs;
      if (m.text in msgs)
        return m.reply(`*"${m.text}"* already exists in the database`);
      msgs[m.text] = M.fromObject(await m.getQuotedObj()).toJSON();
      m.reply(
        `${Func.texted("bold", `Message successfully saved in the database`)} : ${Func.texted("monospace", m.text)}`,
      );
    } else if (m.command == "-msg") {
      if (!m.text)
        return m.reply(`Use *${m.prefix}listmsg* to view the msg list.`);
      let msgs = db.msgs;
      if (!(m.text in msgs))
        return m.reply(`*"${m.text}"* does not exist in the database.`);
      delete msgs[m.text];
      m.reply(
        Func.texted("bold", `Message successfully deleted from the database`),
      );
    } else if (m.command == "listmsg") {
      let msgs = db.msgs;
      let split = Object.entries(msgs).map(([nama, isi]) => {
        return { nama, ...isi };
      });
      let fltr = split.map((v) => "   ◦  " + v.nama).join("\n");
      m.reply(`${fltr}`.trim());
    }
  },
  limit: 1,
};
