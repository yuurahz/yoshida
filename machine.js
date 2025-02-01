require("events").EventEmitter.defaultMaxListeners = 500;
require("module-alias/register");
require("@system/setting");
const fs = require("fs");
const Pino = require("pino");
const baileys = require("baileys");
const { Boom } = require("@hapi/boom");
const { Client, serialize } = require("@system/socket");
const {
  Color,
  lowdb,
  Plugins,
  MongoDB,
  Function: Func,
} = new (require("@yoshx/func"))();
const { JSONFile } = lowdb;
const { loadPlugins, watchPlugins } = Plugins;

(async () => {
  const database = /mongo/.test(process.env.DATABASE_STATE)
    ? new MongoDB(process.env.DATABASE_URL)
    : new JSONFile(process.env.DATABASE_NAME + ".json");

  global.db = {
    users: {},
    groups: {},
    chats: {},
    setting: {},
    stats: {},
    msgs: {},
  };
  await database.read();
  database.write(db);
})();

/** connect to websocket */
async function connectWA() {
  const store = await baileys.makeInMemoryStore({
    logger: Pino().child({
      level: "silent",
      stream: "store",
    }),
  });

  const { state, saveCreds } = await baileys.useMultiFileAuthState(
    `./${process.env.SESSION_NAME}`,
  );

  const { version, isLatest } = await baileys.fetchLatestBaileysVersion();
  console.log(
    Color.cyan(`-- Using WA v${version.join(".")}, isLatest: ${isLatest} --`),
  );

  const conn = await baileys.makeWASocket({
    version,
    logger: Pino({ level: "silent" }),
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(
        state.keys,
        Pino().child({
          level: "silent",
          stream: "store",
        }),
      ),
    },
    printQRInTerminal: !process.env.PAIRING_STATE,
    browser: baileys.Browsers.ubuntu("Edge"),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    retryRequestDelayMs: 10,
    transactionOpts: {
      maxCommitRetries: 10,
      delayBetweenTriesMs: 10,
    },
    maxMsgRetryCount: 15,
    appStateMacVerification: {
      patch: true,
      snapshot: true,
    },
    getMessage: async (key) => {
      const msg = await store.loadMessage(key.remoteJid, key.id);
      return msg?.message || "";
    },
    shouldSyncHistoryMessage: (msg) => {
      console.log(Color.greenBright(`[+] Memuat Chat [${msg.progress}%]`));
      return !!msg.syncType;
    },
  });

  store.bind(conn.ev);
  await Client({ conn, store });

  if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id);

  if (process.env.PAIRING_STATE && !conn.authState.creds.registered) {
    try {
      let phoneNumber = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, "");
      await baileys.delay(3000);
      let code = await conn.requestPairingCode(phoneNumber);
      console.log(
        `\x1b[32m${code?.match(/.{1,4}/g)?.join("-") || code}\x1b[39m`,
      );
    } catch (e) {
      console.error("[+] Gagal mendapatkan kode pairing", e);
      process.exit(1);
    }
  }

  conn.ev.on("connection.update", async (update) => {
    const { lastDisconnect, connection, receivedPendingNotifications } = update;
    if (
      receivedPendingNotifications &&
      !conn.authState.creds?.myAppStateKeyId
    ) {
      conn.ev.flush();
    }
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      switch (reason) {
        case 408:
          console.log(Color.red("[+] Connection timed out. restarting..."));
          await connectWA();
          break;
        case 503:
          console.log(Color.red("[+] Unavailable service. restarting..."));
          await connectWA();
          break;
        case 428:
          console.log(Color.cyan("[+] Connection closed, restarting..."));
          await connectWA();
          break;
        case 515:
          console.log(Color.cyan("[+] Need to restart, restarting..."));
          await connectWA();
          break;
        case 401:
          try {
            console.log(
              Color.cyan("[+] Session Logged Out.. Recreate session..."),
            );
            fs.rmSync(`./${process.env.SESSION_NAME}`, {
              recursive: true,
              force: true,
            });
            console.log(Color.green("[+] Session removed!!"));
            process.send("reset");
          } catch {
            console.log(Color.cyan("[+] Session not found!!"));
          }
          break;
        case 403:
          console.log(Color.red(`[+] Your WhatsApp Has Been Baned :D`));
          fs.rmSync(`./${process.env.SESSION_NAME}`, {
            recursive: true,
            force: true,
          });
          process.send("reset");
          break;
        case 405:
          try {
            console.log(
              Color.cyan("[+] Session Not Logged In.. Recreate session..."),
            );
            fs.rmSync(`./${process.env.SESSION_NAME}`, {
              recursive: true,
              force: true,
            });
            console.log(Color.green("[+] Session removed!!"));
            process.send("reset");
          } catch {
            console.log(Color.cyan("[+] Session not found!!"));
          }
          break;
        default:
      }
    }
    if (connection === "open") {
      console.log(Color.greenBright("[+] Connected. . ."));
    }
  });

  /** write session */
  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = conn.decodeJid(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { id, name: contact.notify };
    }
  });

  conn.ev.on("contacts.upsert", async (update) => {
    for (let contact of update) {
      let id = conn.decodeJid(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { ...(contact || {}), isContact: true };
    }
  });

  conn.ev.on("groups.update", async (updates) => {
    for (let update of updates) {
      let id = update.id;
      if (store.groupMetadata[id]) {
        store.groupMetadata[id] = {
          ...(store.groupMetadata[id] || {}),
          ...(update || {}),
        };
      }
    }
  });

  /** participants update with greetings */
  conn.ev.on(
    "group-participants.update",
    async ({ id, participants, action }) => {
      if (db.setting.self_mode) return;
      let group = db.groups[id] || {};
      switch (action) {
        case "add":
        case "remove":
        case "leave":
        case "invite":
        case "invite_v4":
          if (group.welcome) {
            let groupMetadata =
              (await store.groupMetadata[id]) ||
              (store.contacts[id] || {}).metadata;
            for (let user of participants) {
              let teks = (
                action === "add"
                  ? (
                      group.sWelcome ||
                      `Welcome @user (ʘᴗʘ✿)\n${Func.readMore()}\n@desc`
                    )
                      .replace("@subject", await conn.getName(id))
                      .replace("@desc", groupMetadata.desc.toString())
                  : group.sBye || "Sayonara @user (ー_ー゛)"
              ).replace("@user", "@" + user.split("@")[0]);
              conn.reply(id, teks, null);
            }
          }
      }
    },
  );

  /** handler cmd */
  conn.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages[0].message) return;
    let m = await serialize(conn, messages[0], store);

    if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0)
      store.groupMetadata = await conn.groupFetchAllParticipating();

    if (m.key && !m.key.fromMe && m.key.remoteJid === "status@broadcast") {
      if (m.type === "protocolMessage" && m.message.protocolMessage.type === 0)
        return;

      const emojis = process.env.REACT_STATUS.split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (emojis.length) {
        await conn.sendMessage(
          "status@broadcast",
          {
            react: {
              key: m.key,
              text: emojis[Math.floor(Math.random() * emojis.length)],
            },
          },
          {
            statusJidList: [
              conn.decodeJid(conn.user.id),
              conn.decodeJid(m.key.participant),
            ],
          },
        );
      }
    }

    require("@system/handler")(conn, m, store);
  });

  /** reject call */
  conn.ev.on("call", async (call) => {
    if (call[0].status === "offer") {
      await conn.rejectCall(call[0].id, call[0].from);
    }
  });

  /** clear tmp */
  if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

  setInterval(
    async () => {
      try {
        const tmpFiles = await fs.readdirSync("./tmp");
        if (tmpFiles.length > 0) {
          tmpFiles
            .filter((v) => !v.endsWith(".file"))
            .map((v) => fs.unlinkSync("./tmp/" + v));
        }
      } catch {}
    },
    5 * 60 * 1000,
  );

  /** save database every 30 seconds */
  setInterval(async () => {
    if (database) await db.write(db);
  }, 60_000);

  /** load plugins directory */
  loadPlugins(conn);
  /** watch plugins after change */
  watchPlugins(conn);
  /** handle error */
  process.on("uncaughtException", console.error);
  process.on("unhandledRejection", console.error);
}

connectWA().catch((e) => console.log(e));
