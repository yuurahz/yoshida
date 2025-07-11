module.exports = {
  async before(m, { Func, conn, groupSet }) {
    try {
      if (m.isGroup && groupSet.antibot && m.sender) {
        if (m.isBot && !m.fromMe && !m.isAdmin && m.sender !== conn.user.jid) {
          groupSet.member[m.sender].warning += 1;
          let warning = groupSet.member[m.sender].warning;
          if (warning > 2)
            return m
              .reply(Func.texted("bold", `Warning : [ 3 / 3 ], good bye 👋`))
              .then(() => {
                conn
                  .groupParticipantsUpdate(m.chat, [m.sender], "remove")
                  .then(async () => {
                    groupSet.member[m.sender].warning = 0;
                    m.reply({
                      delete: {
                        remoteJid: m.chat,
                        fromMe: m.isBotAdmin ? false : true,
                        id: m.key.id,
                        participant: m.sender,
                      },
                    });
                  });
              });
          return m
            .reply(
              `— *W A R N I N G*\n\nYou got warning : [ ${warning} / 3 ]\n*Bot detected*, please disable or change to self mode. If you get 5 warnings you will be kicked automatically from the group.`,
            )
            .then(() =>
              m.reply({
                delete: {
                  remoteJid: m.chat,
                  fromMe: m.isBotAdmin ? false : true,
                  id: m.key.id,
                  participant: m.sender,
                },
              }),
            );
        }
      }
    } catch (e) {
      console.log(e);
    }
    return true;
  },
};
