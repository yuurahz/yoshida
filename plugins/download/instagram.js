module.exports = {
  help: ["instagram"],
  tags: ["downloader"],
  command: /^i(nsta(gram(dl)?|dl)|g(dl)?)$/i,
  run: async (m, { API, Func, conn, quoted }) => {
    if (!quoted.text) return m.reply(Func.example(m.prefix, m.command, "link"));
    if (!quoted.text.includes("instagram.com")) return m.reply(mess.invalid);
    m.react("⏱️");
    try {
      const data = await Func.fetchJson(
        API("yosh", "/downloader/instagram", { url: quoted.text }),
      );

      if (!data || !data.result.url || !Array.isArray(data.result.url)) {
        return m.reply("Gagal mengambil data dari Instagram");
      }

      const { metadata } = data.result;
      const cap = Object.entries(metadata || {})
        .map(([a, b]) => `- ${a} : ${b}`)
        .join("\n");

      for (let i = 0; i < data.result.url.length; i++) {
        try {
          const mediaUrl = data.result.url[i];

          const res = await fetch(mediaUrl);
          if (!res.ok) {
            console.log(`Gagal fetch media ${i + 1}: ${res.status}`);
            continue;
          }

          const buffer = Buffer.from(await res.arrayBuffer());

          await conn.sendFile(
            m.chat,
            buffer,
            "",
            i === 0 ? cap : "",
            m,
            {},
            { ephemeralExpiration: m.expiration },
          );

          if (i < data.result.url.length - 1) {
            await Func.delay(3000);
          }
        } catch (mediaError) {
          console.log(`Error mengirim media ${i + 1}:`, mediaError);
          continue;
        }
      }
    } catch (e) {
      console.log(e);
      return m.reply(mess.eror);
    }
  },
  limit: 1,
};
