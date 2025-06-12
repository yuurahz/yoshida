module.exports = {
  help: ["unbanned"],
  tags: ["owner"],
  command: /^(unbanned|unban|unbanchat)$/i,
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
          : m.quoted
            ? m.quoted.sender
            : m.text
              ? m.text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
              : m.chat;
      who = m.mentions[0]
        ? m.mentions[0]
        : m.text
          ? m.text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
          : m.chat;
    } else {
      if (!isOwner) {
        m.reply(mess.owner);
        return false;
      }
      who = m.text ? m.text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : m.chat;
    }
    try {
      if (who.endsWith("g.us")) db.groups[who].isBanned = false;
      else db.users[who].banned = false;
      m.reply(
        `Done Unban! Bot aktif dichat ${(await conn.getName(who)) == undefined ? "ini" : await conn.getName(who)}.`,
      );
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
};
