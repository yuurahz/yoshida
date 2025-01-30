module.exports = {
  run: async (m, { quoted, users, Func }) => {
    users.afk = +new Date();
    users.afkReason = quoted;
    let lungo = `@${m.sender.split("@")[0]} *Is Now AFK*\n» ${quoted ? "*Alasan* : " + quoted : "Tanpa keterangan"}`;
    m.reply(lungo, { mentions: [m.sender] });
  },
  help: ["afk"],
  tags: ["group"],
  command: ["afk"],
};
