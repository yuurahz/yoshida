module.exports = {
  help: ["tweetc"],
  tags: ["maker"],
  command: /^(tweetc)$/i,
  run: async (m, { Func, conn, quoted }) => {
    if (!quoted.text) return m.reply(Func.example(m.prefix, m.command, "halo"));
    m.react("⏱️");
    try {
      const avatar = await conn
        .profilePictureUrl(m.sender, "image")
        .catch((_) => "https://files.catbox.moe/ka3kec.jpg");
      const username = m.sender.split("@")[0];
      const replies = Math.floor(Math.random() * 1000);
      const retweets = Math.floor(Math.random() * 1000);
      const url = `https://some-random-api.com/canvas/misc/tweet?displayname=${encodeURIComponent(m.name)}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar)}&comment=${encodeURIComponent(quoted.text)}&replies=${encodeURIComponent(replies)}&retweets=${encodeURIComponent(retweets)}&theme=dim`;
      m.reply({ image: { url }, caption: mess.done });
    } catch (e) {
      console.log(e);
      return m.reply(mess.failed);
    }
  },
  limit: 1,
};
