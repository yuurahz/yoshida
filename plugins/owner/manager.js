module.exports = {
  help: ["+owner", "-owner", "-prem", "block", "unblock"],
  tags: ["owner"],
  command: /^(\+owner|\-owner|\-prem|block|unblock)$/i,
  run: async (m, { Func, conn }) => {
    try {
      let input = m.text
        ? m.text
        : m.isQuoted
          ? m.quoted.sender
          : m.mentions.length > 0
            ? m.mentions[0]
            : false;
      if (!input)
        return m.reply(Func.texted("bold", `Mention or reply chat target.`));
      let p = await conn.onWhatsApp(input.trim());
      if (!p.exists) return m.reply(Func.texted("bold", `Invalid number.`));
      let jid = conn.decodeJid(p[0].jid);
      let number = jid.replace(/@.+/, "");
      if (command == "+owner") {
        let owners = db.setting.owners;
        if (owners.includes(number))
          return m.reply(Func.texted("bold", `Target is already the owner.`));
        owners.push(number);
        m.reply(Func.texted("bold", `Successfully added @${number} as owner.`));
      } else if (command == "-owner") {
        let owners = db.setting.owners;
        if (!owners.includes(number))
          return m.reply(Func.texted("bold", `Target is not owner.`));
        owners.forEach((data, index) => {
          if (data === number) owners.splice(index, 1);
        });
        m.reply(
          Func.texted(
            "bold",
            `Successfully removing @${number} from owner list.`,
          ),
        );
      } else if (command == "-prem") {
        let data = db.users[jid];
        if (typeof data == "undefined")
          return m.reply(Func.texted("bold", `Can't find user data.`));
        if (!data.premium)
          return m.reply(Func.texted("bold", `Not a premium account.`));
        data.premium = false;
        data.expired = 0;
        m.reply(
          Func.texted(
            "bold",
            `@${jid.replace(/@.+/, "")}'s premium status has been successfully deleted.`,
          ),
        );
      } else if (command == "block") {
        if (jid == conn.user.jid) return m.reply(Func.texted("bold", `??`));
        conn
          .updateBlockStatus(jid, "block")
          .then((res) => m.reply(Func.jsonFormat(res)));
      } else if (command == "unblock") {
        conn
          .updateBlockStatus(jid, "unblock")
          .then((res) => m.reply(Func.jsonFormat(res)));
      }
    } catch (e) {
      m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
