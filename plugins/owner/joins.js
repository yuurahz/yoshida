module.exports = {
  command: /^(join)$/i,
  run: async (m, { conn }) => {
    let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
    let name = m.sender;
    let [_, code] = m.text.match(linkRegex) || [];
    if (!m.args[0]) return m.reply(`Masukan link grup!`);
    if (!code) return m.reply(`Link tidak valid!`);
    if (!m.args[1]) return m.reply(`Masukan jumlah hari!`);
    if (isNaN(m.args[1]))
      return m.reply(`Hanya format angka mewakili jumlah hari.`);
    m.reply(mess.wait);
    try {
      let res = await conn.groupAcceptInvite(code);
      let b = await store.groupMetadata[res];
      let d = b.participants.map((v) => v.id);
      let member = d.toString();
      let e = await d.filter((v) =>
        v.endsWith(owner.number + "@s.whatsapp.net"),
      );
      let jumlahHari = 86400000 * m.args[1];
      let now = new Date() * 1;
      if (now < db.groups[res].expired)
        db.groups[res].expired += jumlahHari;
      else db.groups[res].expired = now + jumlahHari;
      if (e.length)
        await m.reply(
          `Sukses invite bot ke group\n\n${await conn.getName(res)}\n\nBot akan keluar secara otomatis setelah *${Func.toDate(db.groups[res].expired - now)}*`,
        );
      await conn.reply(
        res,
        `Halo everyone 👋\n\nSaya adalah Yoshida, whatsapp bot yang siap membantu kamu mencari data, informasi, mendownload media, dll hanya melalui whatsapp\n\nBot akan keluar otomatis setelah masa aktif habis\n*TimeOut* : *${Func.toDate(db.groups[res].expired - now)}*`,
        null,
        {
          mentions: [d],
        },
      );
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
