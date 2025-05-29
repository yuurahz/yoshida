const {
  generateWAMessageFromContent,
  generateForwardMessageContent,
  downloadContentFromMessage,
  downloadMediaMessage,
  extractMessageContent,
  generateWAMessage,
  jidNormalizedUser,
  areJidsSameUser,
  STORIES_JID,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys");
const PhoneNumber = require("awesome-phonenumber");
const { Function: Func } = new (require("@yoshx/func"))();
const { toAudio, toPTT } = require("@library/converter");
const { fromBuffer } = require("file-type");
const path = require("path");
const pino = require("pino");
const fs = require("fs");

/**
 * Creates a new WhatsApp socket instance with additional utility methods.
 * @param {Object} store - The store object used for managing contacts and messages.
 * @param {...any} args - Additional arguments for the makeWaSocket function.
 * @returns {Promise<Object>} A promise that resolves to the WhatsApp socket instance.
 */
function Client({ conn, store }) {
  const sock = Object.defineProperties(conn, {
    /**
     * Decodes a JID (Jabber ID).
     * @param {string} jid - The JID to decode.
     * @returns {string} The decoded JID.
     */
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

    /**
     * Retrieves the name of a contact or group.
     * @param {string} jid - The JID of the contact or group.
     * @param {boolean} [withoutContact=false] - Whether to exclude the contact name.
     * @returns {Promise<string>} A promise that resolves to the name of the contact or group.
     */
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

    /**
     * Sends a contact card to a WhatsApp contact or group.
     * @param {string} jid - The JID of the recipient.
     * @param {Array<string|number>} contact - An array of contacts to send.
     * @param {Object} [quoted=false] - The quoted message object.
     * @param {Object} [opts={}] - Additional options for the message.
     * @returns {Promise<Object>} A promise that resolves to the message object.
     */
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
        return await conn.sendMessage(
          jid,
          {
            contacts: {
              displayName: "customer support",
              contacts: list,
            },
          },
          { quoted, ...options },
        );
      },
      enumerable: true,
    },

    /**
     * Converts a path to a buffer.
     * @param {string|Buffer} PATH - The path to the file or a buffer.
     * @returns {Promise<Object>} A promise that resolves to an object containing the buffer, MIME type, and extension.
     */
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

    /**
     * Sends a file to a WhatsApp contact or group.
     * @param {string} from - The JID of the recipient.
     * @param {string|Buffer} file - The path to the file or a buffer.
     * @param {Object} quoted - The quoted message object.
     * @param {Object} opt1 - Additional options for the message content.
     * @param {Object} opt2 - Additional options for the message.
     * @returns {Promise<Object>} A promise that resolves to the message object.
     */
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

    /**
     * Downloads media from a message.
     * @param {Object} message - The message object containing the media.
     * @param {string} [pathFile] - The path to save the downloaded media.
     * @returns {Promise<Buffer|string>} A promise that resolves to the buffer or file path.
     */
    downloadMediaMessage: {
      async value(message, filename) {
        let media = await downloadMediaMessage(
          message,
          "buffer",
          {},
          {
            logger: pino({
              timestamp: () => `,"time":"${new Date().toJSON()}"`,
              level: "silent",
            }).child({ class: "conn" }),
            reuploadRequest: conn.updateMediaMessage,
          },
        );
        if (filename) {
          let mime = await fromBuffer(media);
          let filePath = path.join(
            process.cwd() + "/tmp",
            `${filename}.${mime.ext}`,
          );
          fs.promises.writeFile(filePath, media);
          return filePath;
        }

        return media;
      },
      enumerable: true,
    },

    /**
     * reply message
     * @param {<jid>}
     * @param {<text>} {<string>}
     * @param {<quoted><options>}
     */
    reply: {
      value(jid, text = "", quoted, options) {
        return conn.sendMessage(
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
      enumerable: true,
    },

    /** copy & forward message */
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
      enumerable: true,
    },

    /**
     * send album message
     * credit:
     * Muhammad Restu
     *
     * @param {string} jid
     * @param {Object<string, any>} [options]
     * @returns {Promise<import("baileys").WAMessage>}
     */
    sendAlbumMessage: {
      async value(jid, medias, options) {
        options = {
          ...options,
        };
        if (typeof jid !== "string")
          throw new TypeError(
            `jid must be string, received: ${jid} (${jid?.constructor?.name})`,
          );
        for (const media of medias) {
          if (!media.type || (media.type !== "image" && media.type !== "video"))
            throw new TypeError(
              `medias[i].type must be "image" or "video", received: ${media.type} (${media.type?.constructor?.name})`,
            );
          if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data)))
            throw new TypeError(
              `medias[i].data must be object with url or buffer, received: ${media.data} (${media.data?.constructor?.name})`,
            );
        }
        if (medias.length < 2) throw new RangeError("Minimum 2 media");

        const caption = options.text || options.caption || "";
        delete options.text;
        delete options.caption;

        const album = generateWAMessageFromContent(
          jid,
          {
            messageContextInfo: {
              messageSecret: new Uint8Array(Func.randomBytes(32)),
            },
            albumMessage: {
              expectedImageCount: medias.filter(
                (media) => media.type === "image",
              ).length,
              expectedVideoCount: medias.filter(
                (media) => media.type === "video",
              ).length,
              ...(options.quoted
                ? {
                    contextInfo: {
                      remoteJid: options.quoted.key.remoteJid,
                      fromMe: options.quoted.key.fromMe,
                      stanzaId: options.quoted.key.id,
                      participant:
                        options.quoted.key.participant ||
                        options.quoted.key.remoteJid,
                      quotedMessage: options.quoted.message,
                    },
                  }
                : {}),
            },
          },
          {},
        );
        await conn.relayMessage(album.key.remoteJid, album.message, {
          messageId: album.key.id,
        });

        for (const i in medias) {
          const { type, data } = medias[i];
          const img = await generateWAMessage(
            album.key.remoteJid,
            {
              [type]: data,
              ...(i === "0"
                ? {
                    caption,
                  }
                : {}),
            },
            {
              upload: conn.waUploadToServer,
            },
          );
          img.message.messageContextInfo = {
            messageSecret: new Uint8Array(Func.randomBytes(32)),
            messageAssociation: {
              associationType: 1,
              parentMessageKey: album.key,
            },
          };
          await conn.relayMessage(img.key.remoteJid, img.message, {
            messageId: img.key.id,
          });
        }

        return album;
      },
      enumerable: true,
    },

    /**
     * send interactive message
     * @param <{jid}>
     * @param {<array value>}
     * @param {<quoted>}
     */
    sendButtonMessage: {
      async value(jid, array, quoted, json = {}, options = {}) {
        const result = [];

        for (const data of array) {
          if (data.type === "reply") {
            for (const pair of data.value) {
              result.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: pair[0],
                  id: pair[1],
                }),
              });
            }
          } else if (data.type === "bubble") {
            for (const pair of data.value) {
              result.push({
                buttonId: pair[1],
                buttonText: {
                  displayText: pair[0],
                },
                type: 1,
              });
            }
          } else if (data.type === "url") {
            for (const pair of data.value) {
              result.push({
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: pair[0],
                  url: pair[1],
                  merBott_url: pair[1],
                }),
              });
            }
          } else if (data.type === "copy") {
            for (const pair of data.value) {
              result.push({
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: pair[0],
                  copy_code: pair[1],
                }),
              });
            }
          } else if (data.type === "list") {
            let transformedData = data.value.map((item) => ({
              ...(item.headers
                ? {
                    title: item.headers,
                  }
                : {}),
              rows: item.rows.map((row) => ({
                header: row.headers,
                title: row.title,
                description: row.body,
                id: row.command,
              })),
            }));

            let sections = transformedData;
            const listMessage = {
              title: data.title,
              sections,
            };
            result.push({
              name: "single_select",
              buttonParamsJson: JSON.stringify(listMessage),
            });
          }
        }

        let msg;
        if (json.url) {
          let file = await conn.getFile(json.url);
          let mime = file.mime.split("/")[0];
          let mediaMessage = await prepareWAMessageMedia(
            {
              ...(mime === "image"
                ? {
                    image: file.data,
                  }
                : mime === "video"
                  ? {
                      video: file.data,
                    }
                  : {
                      document: file.data,
                      mimetype: file.mime,
                      fileName:
                        json.filename || "Yoshida." + extension(file.mime),
                    }),
            },
            {
              upload: conn.waUploadToServer,
            },
          );

          msg = generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                      text: json.body,
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                      text: json.footer,
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                      hasMediaAttachment: true,
                      ...mediaMessage,
                    }),
                    nativeFlowMessage:
                      proto.Message.InteractiveMessage.NativeFlowMessage.create(
                        {
                          buttons: result,
                        },
                      ),
                    ...options,
                  }),
                },
              },
            },
            {
              userJid: conn.user.jid,
              quoted,
              upload: conn.waUploadToServer,
            },
          );
        } else {
          msg = generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                      text: json.body,
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                      text: json.footer,
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                      hasMediaAttachment: false,
                    }),
                    nativeFlowMessage:
                      proto.Message.InteractiveMessage.NativeFlowMessage.create(
                        {
                          buttons:
                            result.length > 0
                              ? result
                              : [
                                  {
                                    text: "",
                                  },
                                ],
                        },
                      ),
                    ...options,
                  }),
                },
              },
            },
            {
              userJid: conn.user.jid,
              quoted,
              upload: conn.waUploadToServer,
            },
          );
        }

        await conn.relayMessage(msg.key.remoteJid, msg.message, {
          messageId: msg.key.id,
        });
        return msg;
      },
      enumerable: true,
    },

    /**
     * Sends a status with mentions to a WhatsApp contact or group.
     * @param {string} jids - The JIDS of the recipient.
     * @param {Object} [content] - Additional content for the status.
     * @returns {Promise<Object>} A promise that resolves to the message object.
     */
    sendStatusMention: {
      async value(content, jids) {
        const msg = await generateWAMessage(STORIES_JID, content, {
          upload: conn.waUploadToServer,
        });

        const fetchParticipants = async (...jids) => {
          let results = [];
          for (const jid of jids) {
            let { participants } = await conn.groupMetadata(jid);
            participants = participants.map(({ id }) => id);
            results = results.concat(participants);
          }
          return results;
        };

        let statusJidList = [];
        for (const _jid of jids) {
          if (_jid.endsWith("@g.us")) {
            for (const jid of await fetchParticipants(_jid)) {
              statusJidList.push(jid);
            }
          } else {
            statusJidList.push(_jid);
          }
        }
        statusJidList = [...new Set(statusJidList)];

        await conn.relayMessage(msg.key.remoteJid, msg.message, {
          messageId: msg.key.id,
          statusJidList,
          additionalNodes: [
            {
              tag: "meta",
              attrs: {},
              content: [
                {
                  tag: "mentioned_users",
                  attrs: {},
                  content: jids.map((jid) => ({
                    tag: "to",
                    attrs: {
                      jid,
                    },
                    content: undefined,
                  })),
                },
              ],
            },
          ],
        });

        for (const jid of jids) {
          let type = jid.endsWith("@g.us")
            ? "groupStatusMentionMessage"
            : "statusMentionMessage";
          await conn.relayMessage(
            jid,
            {
              [type]: {
                message: {
                  protocolMessage: {
                    key: msg.key,
                    type: 25,
                  },
                },
              },
            },
            {
              additionalNodes: [
                {
                  tag: "meta",
                  attrs: {
                    is_status_mention: "true",
                  },
                  content: undefined,
                },
              ],
            },
          );
        }

        return msg;
      },
      enumerable: true,
    },

    serialize: {
      async value(m) {
        return await serialize(conn, m, store);
      },
      enumerable: true,
    },
  });

  return sock;
}

/**
 * serialize message
 * @param {ReturnType<typeof makeWASocket>} conn
 * @param {proto.WebMessageInfo} msg
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
      m.id.startsWith("B1E") ||
      m.id.startsWith("Fizz");
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
    m.download = () => conn.downloadMediaMessage(m);
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

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
        m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
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
          m.quoted.id.startsWith("B1E") ||
          m.quoted.id.startsWith("Fizz");
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
      await conn.sendPresenceUpdate("composing", m.chat);
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
