const { S_WHATSAPP_NET } = require("baileys");

module.exports = {
  command: /^(setpp)$/i,
  run: async (m, { Func, conn }) => {
    try {
      let q = m.isQuoted ? m.quoted : m;
      let mime = (q.msg || q).mimetype || "";
      if (/image\/(jpe?g|png)/.test(mime)) {
        m.react("⏱️");
        const buffer = await conn.downloadMediaMessage(q.message);
        const { img } = await Func.generateProfilePicture(buffer);
        await conn
          .query({
            tag: "iq",
            attrs: {
              to: S_WHATSAPP_NET,
              type: "set",
              xmlns: "w:profile:picture",
            },
            content: [
              {
                tag: "picture",
                attrs: {
                  type: "image",
                },
                content: img,
              },
            ],
          })
          .then(() => {
            m.reply(
              Func.texted(
                "bold",
                `Profile photo has been successfully changed.`,
              ),
            );
          });
      } else
        return m.reply(
          Func.texted(
            "bold",
            `Reply to the photo that will be made into the bot's profile photo.`,
          ),
        );
    } catch (e) {
      m.reply(Func.jsonFormat(e));
    }
  },
  owner: true,
};
