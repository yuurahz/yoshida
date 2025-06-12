module.exports = {
  help: ["addprem"],
  tags: ["owner"],
  command: /^(add|tambah|\+)p(rem)?$/i,
  run: async (m, { conn, Func }) => {
    if (m.isQuoted) {
      if (m.quoted.isBot)
        return m.reply(
          Func.texted("bold", `Can't make the bot a premium user.`),
        );
      if (m.args && isNaN(m.args[0]))
        return m.reply(Func.texted("bold", `Day must be a number.`));
      let days = m.args[0] ? parseInt(m.args[0]) : 30;
      let jid = conn.decodeJid(m.quoted.sender);
      let users = db.users[jid];
      users.expired += users.premium
        ? 86400000 * days
        : new Date() * 1 + 86400000 * days;
      users.limit = process.env.LIMIT_PREM;
      m.reply(
        users.premium
          ? Func.texted(
              "bold",
              `Succesfully added ${days} days premium access for @${jid.replace(/@.+/, "")}.`,
            )
          : Func.texted(
              "bold",
              `Successfully added @${jid.replace(/@.+/, "")} to premium user.`,
            ),
      ).then(() => (users.premium = true));
    } else if (m.mentions.length != 0) {
      if (m.args && m.args[1] && isNaN(m.args[1]))
        return m.reply(Func.texted("bold", `Day must be a number.`));
      let days = m.args[1] ? parseInt(m.args[1]) : 30;
      let jid = conn.decodeJid(m.mentions[0]);
      const users = db.users[jid];
      users.expired += users.premium
        ? 86400000 * days
        : new Date() * 1 + 86400000 * days;
      users.limit = process.env.LIMIT_PREM;
      m.reply(
        users.premium
          ? Func.texted(
              "bold",
              `Succesfully added ${days} days premium access for @${jid.replace(/@.+/, "")}.`,
            )
          : Func.texted(
              "bold",
              `Successfully added @${jid.replace(/@.+/, "")} to premium user.`,
            ),
      ).then(() => (users.premium = true));
    } else if (m.text && /|/.test(m.text)) {
      let [number, day] = m.text.split`|`;
      let p = (await conn.onWhatsApp(number))[0] || {};
      if (!p.exists)
        return m.reply(
          Func.texted("bold", "Number not registered on WhatsApp."),
        );
      if (isNaN(day))
        return m.reply(Func.texted("bold", `Day must be a number.`));
      let days = day ? parseInt(day) : 30;
      let jid = conn.decodeJid(p.jid);
      const users = db.users[jid];
      if (!users) return m.reply(Func.texted("bold", `Can't find user data.`));
      users.expired += users.premium
        ? 86400000 * days
        : new Date() * 1 + 86400000 * days;
      users.limit = process.env.LIMIT_PREM;
      m.reply(
        users.premium
          ? Func.texted(
              "bold",
              `Succesfully added ${days} days premium access for @${jid.replace(/@.+/, "")}.`,
            )
          : Func.texted(
              "bold",
              `Successfully added @${jid.replace(/@.+/, "")} to premium user.`,
            ),
      ).then(() => (users.premium = true));
    } else {
      let teks = `~ *Example* :\n\n`;
      teks += `${m.prefix + m.command} 6285xxxxx | 7\n`;
      teks += `${m.prefix + m.command} @0 7\n`;
      teks += `${m.prefix + m.command} 7 (reply chat target)`;
      m.reply(teks);
    }
  },
  owner: true,
};
