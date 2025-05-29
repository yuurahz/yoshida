const { S_WHATSAPP_NET } = require("@whiskeysockets/baileys");

module.exports = {
  command: /^(setpp)$/i,
  run: async (m, { Func, quoted, conn }) => {
    try {
      let mime = (quoted.msg || quoted).mimetype || "";
      if (/image\/(jpe?g|png)/.test(mime)) {
        m.react("⏱️");
        const buffer = await quoted.download();
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
