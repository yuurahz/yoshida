module.exports = {
  command: ["-sewa"],
  run: async (m, {}) => {
    let who;
    if (m.isGroup) who = m.args[1] ? m.args[1] : m.chat;
    else who = m.args[1];
    if (new Date() * 1 < db.groups[who].expired)
      db.groups[who].expired = 0;
    else db.groups[who].expired = 0;
    m.reply("Berhasil menghapus hari kadaluarsa Grup ini");
  },
  group: true,
  owner: true,
};
