const moment = require("moment-timezone");

module.exports = {
  command: /^(hitstat|hitdaily)$/i,
  run: async (m, { conn, Func }) => {
    let totalhit = Object.values(db.data.stats).reduce(
      (sum, { hitstat }) => sum + hitstat,
      0,
    );
    let totaltoday = Object.values(db.data.stats).reduce(
      (sum, { today }) => sum + today,
      0,
    );
    if (m.command == "hitstat") {
      if (totalhit === 0)
        return m.reply(Func.texted("bold", "No commands hit"));
      let stats = Object.entries(db.data.stats)
        .filter(([_, { hitstat }]) => hitstat > 0)
        .slice(0, 10)
        .sort(([, a], [, b]) => b.hitstat - a.hitstat)
        .map(([key, { hitstat, lasthit }], idx) => {
          return `   ┌  *Command* : ${Func.texted("monospace", m.prefix + key)}\n   │  *Hit* : ${hitstat}x\n   └  *Last Hit* : ${moment(lasthit).format("DD/MM/YY HH:mm:ss")}`;
        })
        .join("\n\n");
      m.reply(
        "乂  *H I T S T A T*\n\n" +
          `“Total command hit statistics are currently ${Func.formatNumber(totalhit)} hits.”\n\n` +
          stats +
          "\n\n" +
          process.env.FOOTER,
      );
    } else if (m.command == "hitdaily") {
      if (totaltoday === 0)
        return m.reply(Func.texted("bold", "No commands hit"));
      let stats = Object.entries(db.data.stats)
        .filter(([_, { today }]) => today > 0)
        .slice(0, 10)
        .sort(([, a], [, b]) => b.today - a.today)
        .map(([key, { today, lasthit }], idx) => {
          return `   ┌  *Command* : ${Func.texted("monospace", m.prefix + key)}\n   │  *Hit* : ${today}x\n   └  *Last Hit* : ${moment(lasthit).format("DD/MM/YY HH:mm:ss")}`;
        })
        .join("\n\n");
      m.reply(
        "乂  *H I T D A I L Y*\n\n" +
          `“Total command hit statistics for today ${Func.formatNumber(totaltoday)} hits.”\n\n` +
          stats +
          "\n\n" +
          process.env.FOOTER,
      );
    }
  },
};
