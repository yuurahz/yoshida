const {
  generateWAMessageFromContent,
  generateForwardMessageContent,
  downloadContentFromMessage,
  extractMessageContent,
  jidNormalizedUser,
  areJidsSameUser,
  jidDecode,
  proto,
} = require("baileys");
const PhoneNumber = require("awesome-phonenumber");
const { Function: Func } = new (require("@yoshx/func"))();
const { toAudio, toPTT } = require("@library/converter");
const { fromBuffer } = require("file-type");
const path = require("path");
const fs = require("fs");

/**
 * Creates a new WhatsApp socket instance with additional utility methods.
 * @param {Object} store - The store object used for managing contacts and messages.
 * @param {...any} args - Additional arguments for the makeWaSocket function.
 * @returns {Promise<Object>} A promise that resolves to the WhatsApp socket instance.
 */
function Client({ conn, store }) {
  const sock = Object.defineProperties(conn, {
    decodeJid: {
      value(jid) {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
          let decode = jidDecode(jid) || {};
          return (
            (decode.user &&
              decode.server &&
              decode.user + "@" + decode.server) ||
            jid
          );
        } else return jid;
      },
      enumerable: true,
    },

    getName: {
      value(jid = "", withoutContact = false) {
        jid = conn.decodeJid(jid);
        withoutContact = this.withoutContact || withoutContact;
        let v;
        if (jid.endsWith("g.us"))
          return new Promise(async (resolve) => {
            v = store.chats[jid] || {};
            if (!(v.name || v.subject))
              v = (await store.groupMetadata[jid]) || {};
            resolve(
              v.name ||
                v.subject ||
                PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
                  "international",
                ),
            );
          });
        else
          v =
            jid === "0@s.whatsapp.net"
              ? {
                  jid,
                  vname: "WhatsApp",
                }
              : areJidsSameUser(jid, conn.user.id)
                ? conn.user
                : store.chats[jid] || {};
        return (
          (withoutContact ? "" : v.name) ||
          v.subject ||
          v.vname ||
          v.notify ||
          v.verifiedName ||
          PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
            "international",
          )
        );
      },
      enumerable: true,
    },

    sendContact: {
      async value(jid, number, quoted, options = {}) {
        let list = [];
        for (let v of number) {
          if (v.endsWith("g.us")) continue;
          v = v.replace(/\D+/g, "");
          list.push({
            displayName: conn.getName(v + "@s.whatsapp.net"),
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${conn.getName(v + "@s.whatsapp.net")}\nFN:${conn.getName(v + "@s.whatsapp.net")}\nitem1.TEL;waid=${v}:${v}\nEND:VCARD`,
          });
        }
        return conn.sendMessage(
          jid,
          {
            contacts: {
              displayName: "support",
              contacts: list,
            },
          },
          { quoted, ...options },
        );
      },
      enumerable: true,
    },

    getFile: {
      async value(PATH, returnAsFilename) {
        let res, filename;
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : /^data:.*?\/.*?base64,/i.test(PATH)
            ? Buffer.from(PATH.split`,`[1], "base64")
            : /^https?:\/\//.test(PATH)
              ? await (res = await Func.fetchBuffer(PATH))
              : fs.existsSync(PATH)
                ? ((filename = PATH), fs.readFileSync(PATH))
                : typeof PATH === "string"
                  ? PATH
                  : Buffer.alloc(0);
        if (!Buffer.isBuffer(data))
          throw new TypeError("Result is not a buffer");
        const type = (await fromBuffer(data)) || {
          mime: "text/plain",
          ext: ".txt",
        };
        if (data && returnAsFilename && !filename)
          (filename = path.join(
            __dirname,
            "../tmp/" + new Date() * 1 + type.ext,
          )),
            await fs.writeFileSync(filename, data);
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.unlinkSync(filename);
          },
        };
      },
      enumerable: true,
    },

    sendFile: {
      async value(
        jid,
        path,
        filename = "",
        caption = "",
        quoted,
        ptt = false,
        options = {},
      ) {
        await conn.sendPresenceUpdate("composing", jid);
        let type = await conn.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;
        if ((res && res.status !== 200) || file.length <= 65536) {
          try {
            return {
              json: JSON.parse(file.toString()),
            };
          } catch (e) {
            if (e.json) return e.json;
          }
        }
        let opt = { filename };
        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;
        let mtype = "",
          mimetype = type.mime,
          convert;
        if (
          /webp/.test(type.mime) ||
          (/image/.test(type.mime) && options.asSticker)
        )
          mtype = "sticker";
        else if (
          /image/.test(type.mime) ||
          (/webp/.test(type.mime) && options.asImage)
        )
          mtype = "image";
        else if (/video/.test(type.mime)) mtype = "video";
        else if (/audio/.test(type.mime))
          (convert = await (ptt ? toPTT : toAudio)(file, type.ext)),
            (file = convert.data),
            (pathFile = convert.filename),
            (mtype = "audio"),
            (mimetype = "audio/ogg codecs=opus");
        else mtype = "document";
        if (options.asDocument) mtype = "document";
        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;
        let message = {
          ...options,
          caption,
          ptt,
          [mtype]: {
            url: pathFile,
          },
          mimetype,
        };
        let m;
        try {
          m = await conn.sendMessage(jid, message, {
            ...opt,
            ...options,
          });
        } catch (e) {
          console.error(e);
          m = null;
        } finally {
          if (!m)
            m = await conn.sendMessage(
              jid,
              {
                ...message,
                [mtype]: file,
              },
              {
                ...opt,
                ...options,
              },
            );
          return m;
        }
      },
      enumerable: true,
    },

    downloadMediaMessage: {
      value(message, pathFile) {
        return new Promise(async (resolve, reject) => {
          const type = Object.keys(message)[0];
          const mimeMap = {
            imageMessage: "image",
            videoMessage: "video",
            stickerMessage: "sticker",
            documentMessage: "document",
            audioMessage: "audio",
          };
          if (!mimeMap[type]) {
            reject("Invalid message type");
            return;
          }
          const messageType = mimeMap[type];
          const stream = await downloadContentFromMessage(
            message[type],
            messageType,
          );
          const buffer = [];
          for await (const chunk of stream) {
            buffer.push(chunk);
          }
          if (pathFile) {
            try {
              await fs.promises.writeFile(pathFile, Buffer.concat(buffer));
              resolve(pathFile);
            } catch (error) {
              reject(error);
            }
          } else {
            resolve(Buffer.concat(buffer));
          }
        });
      },
      enumerable: false,
    },

    reply: {
      async value(jid, text = "", quoted, options) {
        return Buffer.isBuffer(text)
          ? conn.sendFile(jid, text, "file", "", quoted, false, options)
          : conn.sendMessage(
              jid,
              {
                ...options,
                text,
                mentions: Func.parseMention(text),
              },
              {
                quoted,
                ...options,
                mentions: Func.parseMention(text),
              },
            );
      },
    },

    copyNForward: {
      async value(jid, message, forwardingScore = true, options = {}) {
        let m = generateForwardMessageContent(message, !!forwardingScore);
        let mtype = Object.keys(m)[0];
        if (
          forwardingScore &&
          typeof forwardingScore == "number" &&
          forwardingScore > 1
        )
          m[mtype].contextInfo.forwardingScore += forwardingScore;
        m = generateWAMessageFromContent(jid, m, {
          ...options,
          userJid: conn.user.id,
        });
        await conn.relayMessage(jid, m.message, {
          messageId: m.key.id,
          additionalAttributes: { ...options },
        });
        return m;
      },
    },

    fakeReply: {
      value(
        jid,
        text = "",
        fakeJid = conn.user.jid,
        fakeText = "",
        fakeGroupJid,
        options,
      ) {
        return conn.sendMessage(
          jid,
          { text: text },
          {
            quoted: {
              key: {
                fromMe: fakeJid == conn.user.jid,
                participant: fakeJid,
                ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}),
              },
              message: { conversation: fakeText },
              ...options,
            },
          },
        );
      },
    },

    cMod: {
      value(jid, copy, text = "", sender = conn.user.id, options = {}) {
        let mtype = getContentType(copy.message);
        let content = copy.message[mtype];
        if (typeof content === "string") copy.message[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== "string") {
          copy.message[mtype] = { ...content, ...options };
          copy.message[mtype].contextInfo = {
            ...(content.contextInfo || {}),
            mentionedJid:
              options.mentions || content.contextInfo?.mentionedJid || [],
          };
        }
        if (copy.key.participant)
          sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes("@s.whatsapp.net"))
          sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes("@broadcast"))
          sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id);
        return proto.WebMessageInfo.fromObject(copy);
      },
      enumerable: false,
    },

    serialize: {
      async value(m) {
        return await serialize(conn, m, store);
      },
    },
  });

  return sock;
}

/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn
 * @param {proto.WebMessageInfo} m
 * @param {store} memory store
 */
async function serialize(conn, msg, store) {
  let m = {};
  if (!msg.message) return;
  if (!msg) return msg;
  m.message = parseMessage(msg.message);
  if (msg.key) {
    m.key = msg.key;
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.device = /^3A/.test(m.id)
      ? "ios"
      : m.id.startsWith("3EB")
        ? "web"
        : /^.{21}/.test(m.id)
          ? "android"
          : /^.{18}/.test(m.id)
            ? "desktop"
            : "unknown";
    m.isBot =
      m.id.startsWith("BAE5") ||
      m.id.startsWith("3EB") ||
      m.id.startsWith("FELZ") ||
      m.id.startsWith("B1E");
    m.chat = m.key.remoteJid.startsWith("status")
      ? jidNormalizedUser(m.key?.participant || msg.participant)
      : jidNormalizedUser(m.key.remoteJid);
    m.participant =
      jidNormalizedUser(m.message?.participant || m.key.participant) || false;
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = jidNormalizedUser(
      m.fromMe ? conn.user.id : m.isGroup ? m.participant : m.chat,
    );
    m.name = msg.pushName;
  }

  if (m.isGroup) {
    if (!(m.chat in store.groupMetadata))
      store.groupMetadata[m.chat] = await conn.groupMetadata(m.chat);
    m.metadata = store.groupMetadata[m.chat];
    m.groupAdmins =
      m.isGroup &&
      m.metadata.participants.reduce(
        (memberAdmin, memberNow) =>
          (memberNow.admin
            ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
            : [...memberAdmin]) && memberAdmin,
        [],
      );
    m.isAdmin =
      m.isGroup && !!m.groupAdmins.find((member) => member.id === m.sender);
    m.isBotAdmin =
      m.isGroup &&
      !!m.groupAdmins.find(
        (member) => member.id === jidNormalizedUser(conn.user.id),
      );
  }

  if (m.message) {
    m.type = getContentType(m.message) || Object.keys(m.message)[0];
    m.msg = parseMessage(m.message[m.type]) || m.message[m.type];
    m.mentions = [
      ...(m.msg?.contextInfo?.mentionedJid || []),
      ...(m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
    ];
    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      "";
    m.prefix = new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi").test(
      m.body,
    )
      ? m.body.match(new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"))[0]
      : "";
    m.command =
      m.body && m.body.trim().replace(m.prefix, "").trim().split(/ +/).shift();
    m.args =
      m.body
        .trim()
        .replace(new RegExp("^" + escapeRegExp(m.prefix), "i"), "")
        .replace(m.command, "")
        .split(/ +/)
        .filter((a) => a) || [];
    m.text = m.args.join(" ").trim();
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamps =
      typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp * 1000
        : m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;
    m.download = (filename) => conn.downloadMediaMessage(m.message, filename);

    m.isQuoted = false;
    if (m.msg?.contextInfo?.quotedMessage) {
      m.isQuoted = true;
      m.quoted = {};
      m.quoted.message = parseMessage(m.msg?.contextInfo?.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type =
          getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg =
          parseMessage(m.quoted.message[m.quoted.type]) ||
          m.quoted.message[m.quoted.type];
        m.quoted.isMedia =
          !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
        m.quoted.download = (filename) =>
          conn.downloadMediaMessage(m.quoted.message, filename);
        m.quoted.key = {
          remoteJid: m.msg?.contextInfo?.remoteJid || m.chat,
          participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
          fromMe: areJidsSameUser(
            jidNormalizedUser(m.msg?.contextInfo?.participant),
            jidNormalizedUser(conn?.user?.id),
          ),
          id: m.msg?.contextInfo?.stanzaId,
        };
        m.quoted.chat = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid)
          ? m.quoted.key.participant
          : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.id = m.msg?.contextInfo?.stanzaId;
        m.quoted.device = /^3A/.test(m.quoted.id)
          ? "ios"
          : /^3E/.test(m.quoted.id)
            ? "web"
            : /^.{21}/.test(m.quoted.id)
              ? "android"
              : /^.{18}/.test(m.quoted.id)
                ? "desktop"
                : "unknown";
        m.quoted.isBot =
          m.quoted.id.startsWith("BAE5") ||
          m.quoted.id.startsWith("3EB") ||
          m.quoted.id.startsWith("FELZ") ||
          m.quoted.id.startsWith("B1E");
        m.quoted.isGroup = m.quoted.chat.endsWith("@g.us");
        m.quoted.sender = jidNormalizedUser(
          m.msg?.contextInfo?.participant || m.quoted.chat,
        );
        m.quoted.mentions = [
          ...(m.quoted.msg?.contextInfo?.mentionedJid || []),
          ...(m.quoted.msg?.contextInfo?.groupMentions?.map(
            (v) => v.groupJid,
          ) || []),
        ];
        m.quoted.body =
          m.quoted.msg?.text ||
          m.quoted.msg?.caption ||
          m.quoted?.message?.conversation ||
          m.quoted.msg?.selectedButtonId ||
          m.quoted.msg?.singleSelectReply?.selectedRowId ||
          m.quoted.msg?.selectedId ||
          m.quoted.msg?.contentText ||
          m.quoted.msg?.selectedDisplayText ||
          m.quoted.msg?.title ||
          m.quoted?.msg?.name ||
          "";
        m.quoted.prefix = new RegExp(
          "^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]",
          "gi",
        ).test(m.quoted.body)
          ? m.quoted.body.match(
              new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"),
            )[0]
          : "";
        m.quoted.command =
          m.quoted.body &&
          m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
        m.quoted.args =
          m.quoted.body
            .trim()
            .replace(new RegExp("^" + escapeRegExp(m.quoted.prefix), "i"), "")
            .replace(m.quoted.command, "")
            .split(/ +/)
            .filter((a) => a) || [];
        m.quoted.text = m.quoted.args.join(" ").trim() || m.quoted.body;
        m.quoted.name = conn.getName(m.quoted.sender);
        let vM = (m.quoted.fakeObj = proto.WebMessageInfo.fromObject({
          key: {
            fromMe: m.quoted.fromMe,
            remoteJid: m.quoted.chat,
            id: m.quoted.id,
          },
          message: m.quoted.message,
          ...(m.isGroup
            ? {
                participant: m.quoted.sender,
              }
            : {}),
        }));
        m.getQuotedObj = m.getQuotedMessage = async () => {
          if (!m.quoted.id) return null;
          let q = proto.WebMessageInfo.fromObject(
            (await store.loadMessage(m.chat, m.quoted.id)) || vM,
          );
          return await serialize(conn, q, store);
        };
      }
    }
  }

  m.react = async (text) => {
    await conn.sendMessage(m.chat, {
      react: {
        text: text,
        key: m.key,
      },
    });
  };

  m.reply = async (text, options = {}) => {
    if (typeof text === "string") {
      return await conn.sendMessage(
        m.chat,
        { text, mentions: Func.parseMention(text), ...options },
        {
          quoted: m,
          mentions: Func.parseMention(text),
          ephemeralExpiration: m.expiration,
          ...options,
        },
      );
    } else if (typeof text === "object" && typeof text !== "string") {
      return conn.sendMessage(
        m.chat,
        { ...text, ...options },
        {
          quoted: m,
          ephemeralExpiration: m.expiration,
          ...options,
        },
      );
    }
  };

  return m;
}

function getContentType(content) {
  if (content) {
    const keys = Object.keys(content);
    const key = keys.find(
      (k) =>
        (k === "conversation" ||
          k.endsWith("Message") ||
          k.includes("V2") ||
          k.includes("V3")) &&
        k !== "senderKeyDistributionMessage",
    );
    return key;
  }
}

function parseMessage(content) {
  content = extractMessageContent(content);
  if (content && content.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (
    content &&
    content.protocolMessage &&
    content.protocolMessage.type == 14
  ) {
    let type = getContentType(content.protocolMessage);
    content = content.protocolMessage[type];
  }
  if (content && content.message) {
    let type = getContentType(content.message);
    content = content.message[type];
  }
  return content;
}

function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

module.exports = { Client, serialize };
