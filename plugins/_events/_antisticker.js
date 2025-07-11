module.exports = {
  async before(m, { Func, groupSet }) {
    if (m.isGroup && groupSet.antisticker && /stickerMessage/.test(m.type)) {
      return m
        .reply({
          delete: {
            remoteJid: m.chat,
            fromMe: m.isBotAdmin ? false : true,
            id: m.key.id,
            participant: m.sender,
          },
        })
        .then(() =>
          m.reply(Func.texted("bold", "Antisticker Mode Activated!")),
        );
    }
    return true;
  },
};
