module.exports = {
  before: async (m, { conn, users }) => {
    if (!m.isGroup || m.chat.endsWith("broadcast") || users.banned || m.isBot)
      return;
    if (!(m.body in db.msgs)) return;
    let _m = await conn.serialize(
      JSON.parse(JSON.stringify(db.msgs[m.body]), (_, v) =>
        null !== v &&
        "object" == typeof v &&
        "type" in v &&
        "Buffer" === v.type &&
        "data" in v &&
        Array.isArray(v.data)
          ? Buffer.from(v.data)
          : v,
      ),
    );
    await m.reply({ forward: _m });
  },
};
