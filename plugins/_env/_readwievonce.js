module.exports = {
  command: /^(readviewonce|rvo|readvo)$/i,
  run: async (m, { Func, quoted }) => {
    if (!quoted.msg.viewOnce)
      return m.reply(Func.texted("bold", "Reply viewonce message."));
    quoted.msg.viewOnce = false;
    await m.reply({ forward: quoted, force: true });
  },
};
