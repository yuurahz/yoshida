module.exports = {
  async before(m, { Func, conn, users }) {
    if (users.afk > -1) {
      m.reply(
        `*Kamu Berhenti Afk* ${users.afkReason ? "*Setelah :* " + users.afkReason : ""}\n» *Selama* ${Func.toTime(new Date() - users.afk)}`.trim(),
      );
      users.afk = -1;
      users.afkReason = "";
    }
    let jids = [
      ...new Set([
        ...(m.mentions || []),
        ...(m.quoted ? [m.quoted.sender] : []),
      ]),
    ];
    for (let jid of jids) {
      let user = db.users[jid];
      if (!user) continue;
      let afkTime = user.afk;
      if (!afkTime || afkTime < 0) continue;
      let reason = user.afkReason || "";
      m.reply(
        `*Dia Lagi AFK* ${reason ? "Alasan " + reason : "Tanpa Keterangan"}\n» *Selama* ${Func.toTime(new Date() - afkTime)}`.trim(),
      );
    }
    return true;
  },
};
