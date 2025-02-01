module.exports = {
  command: /^(restart|r)$/i,
  run: async (m, { Func }) => {
    await m.reply(Func.texted("bold", "Restarting . . .")).then(async () => {
      process.send("reset");
    });
  },
  owner: true,
};
