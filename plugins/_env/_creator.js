module.exports = {
  command: /^(owner|creator)$/i,
  run: async (m, { conn, Func, setting }) => {
    await conn.sendContact(m.chat, setting.owners, m, {
      ephemeralExpiration: m.expiration,
    });
  },
};
