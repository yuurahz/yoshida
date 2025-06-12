module.exports = {
  help: ["banned"],
  tags: ["owner"],
  command: /^(banned|ban|banchat)$/i,
  run: async (m, { Func, conn, isOwner }) => {
    let who;
    if (m.isGroup) {
      if (!(m.isAdmin || isOwner)) {
        m.reply(mess.admin);
        return false;
      }
      if (isOwner)
        who = m.mentions[0]
          ? m.mentions[0]
          : m.isQuoted
            ? m.quoted.sender
            : m.text
              ? m.text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
              : m.chat;
      else who = m.chat;
    } else {
      if (!isOwner) {
        m.reply(mess.owner);
        return false;
      }
      who = m.text ? m.text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : m.chat;
    }

    try {
      if (who.endsWith("g.us")) db.groups[who].isBanned = true;
      else db.users[who].banned = true;
      m.reply(
        `Successfully banned! ${await conn.user.name} inactive on chat ${(await conn.getName(who)) == undefined ? "this" : await conn.getName(who)}.`,
      );
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
};
