module.exports = {
  command: /^(sewa)$/i,
  run: async (m, { conn, Func }) => {
    if (!m.args[0] || isNaN(m.args[0]))
      return m.reply(Func.example(m.prefix, m.command, "30"));
    let who;
    if (m.isGroup) who = m.args[1] ? m.args[1] : m.chat;
    else who = m.args[1];
    var jumlahHari = 86400000 * m.args[0];
    var now = new Date() * 1;
    if (now < global.db.data.groups[who].expired)
      db.data.groups[who].expired += jumlahHari;
    else db.data.groups[who].expired = now + jumlahHari;
    m.reply(
      `successfully set the expiration date for ${await conn.getName(who)} for ${m.args[0]} days\n\nCountdown : ${Func.toDate(db.data.groups[who].expired - now)}`,
    );
  },
  owner: true,
};
