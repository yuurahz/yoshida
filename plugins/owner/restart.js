module.exports = {
  command: /^(restart|r)$/i,
  run: async (m, { Func }) => {
    await m.reply(Func.texted("bold", "Restarting . . .")).then(async () => {
      await db.write(db.data);
      process.send("reset");
    });
  },
  owner: true,
};
