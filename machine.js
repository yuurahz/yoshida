(async () => {
  require("events").EventEmitter.defaultMaxListeners = 500;
  require("module-alias/register");
  require("@system/setting");
  const fs = require("fs");
  const pino = require("pino");
  const baileys = require("baileys");
  const cron = require("node-cron");
  const { Boom } = require("@hapi/boom");
  const NodeCache = require("node-cache");
  const { Client, serialize } = require("@system/socket");
  const { Local, MongoDB } = require("@system/provider");
  const { Color, Libs, Plugins, Function: Func } = new (require("@yoshx/func"))();
  const { loadPlugins, watchPlugins } = Plugins;
  const { loadLibs, watchLibs } = Libs;
  
  /** database options */
  const mydb = /json/i.test(process.env.DATABASE_STATE)
    ? new Local()
    : /mongo/i.test(process.env.DATABASE_STATE)
      ? new MongoDB(process.env.DATABASE_URL, "db_bot")
      : process.exit(1);

  /** database init */
  global.db = await mydb.read();
  if (!db || Object.keys(db).length === 0) {
    db = {
      users: {},
      groups: {},
      chats: {},
      setting: {},
      stats: {},
      msgs: {},
      sticker: {},
    };
    await mydb.write(db);
    console.log(Color.green("[ DATABASE ] Database initialized!"));
  } else {
    console.log(Color.yellow("[ DATABASE ] Database loaded."));
  }

  const logger = await pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
  }).child({ class: "conn" });
  logger.level = "silent";

  /** connect to websocket */
  const connectWA = async () => {
    const store = await baileys.makeInMemoryStore({
      logger,
    });

    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      `./${process.env.SESSION_NAME}`,
    );

    const { version, isLatest } = await baileys.fetchLatestBaileysVersion();
    console.log(
      Color.cyan(`-- Using WA v${version.join(".")}, isLatest: ${isLatest} --`),
    );

    const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

    const conn = await baileys.makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: baileys.makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: !process.env.PAIRING_STATE,
      browser: baileys.Browsers.macOS("Firefox"),
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      retryRequestDelayMs: 10,
      transactionOpts: {
        maxCommitRetries: 10,
        delayBetweenTriesMs: 10,
      },
      defaultQueryTimeoutMs: undefined,
      maxMsgRetryCount: 15,
      appStateMacVerification: {
        patch: true,
        snapshot: true,
      },
      cachedGroupMetadata: async (jid) => groupCache.get(jid),
      getMessage: async (key) => {
        const jid = await baileys.jidNormalizedUser(key.remoteJid);
        const msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
      },
      shouldSyncHistoryMessage: (msg) => {
        console.log(Color.greenBright(`[+] Memuat Chat [${msg.progress}%]`));
        return !!msg.syncType;
      },
    });

    store.bind(conn.ev);
    await Client({ conn, store });

    if (conn.user && conn.user.id)
      conn.user.jid = await conn.decodeJid(conn.user.id);

    if (process.env.PAIRING_STATE && !conn.authState.creds.registered) {
      try {
        const phoneNumber = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, "");
        await baileys.delay(3000);
        const code = await conn.requestPairingCode(phoneNumber);
        console.log(
          `\x1b[32m${code?.match(/.{1,4}/g)?.join("-") || code}\x1b[39m`,
        );
      } catch (e) {
        console.error("[+] Gagal mendapatkan kode pairing", e);
        process.exit(1);
      }
    }

    conn.ev.on("connection.update", async (update) => {
      const { lastDisconnect, connection, receivedPendingNotifications } =
        update;
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
            process.exit(1);
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

    /** add contacts to store */
    conn.ev.on("contacts.update", (update) => {
      for (let contact of update) {
        let id = conn.decodeJid(contact.id);
        if (store && store.contacts)
          store.contacts[id] = {
            ...(store.contacts?.[id] || {}),
            ...(contact || {}),
          };
      }
    });

    /** add contact upsert to store */
    conn.ev.on("contacts.upsert", async (update) => {
      for (let contact of update) {
        let id = conn.decodeJid(contact.id);
        if (store && store.contacts)
          store.contacts[id] = { ...(contact || {}), isContact: true };
      }
    });

    /** update group changes to store */
    conn.ev.on("groups.update", async (updates) => {
      for (const update of updates) {
        const metadata = await conn.groupMetadata(update.id);
        groupCache.set(update.id, metadata);
        if (store.groupMetadata[update.id]) {
          store.groupMetadata[update.id] = {
            ...(store.groupMetadata[update.id] || {}),
            ...(update || {}),
          };
        }
      }
    });

    /** participants update */
    conn.ev.on("group-participants.update", ({ id, participants, action }) => {
      const group = db.groups[id];
      const metadata = store.groupMetadata[id];
      groupCache.set(id, metadata);
      if (metadata) {
        switch (action) {
          case "add":
          case "revoked_membership_requests":
            metadata.participants.push(
              ...participants.map((id) => ({
                id: baileys.jidNormalizedUser(id),
                admin: null,
              })),
            );
            break;
          case "demote":
          case "promote":
            for (const participant of metadata.participants) {
              let id = baileys.jidNormalizedUser(participant.id);
              if (participants.includes(id)) {
                participant.admin = action === "promote" ? "admin" : null;
              }
            }
            break;
          case "remove":
            metadata.participants = metadata.participants.filter(
              (p) => !participants.includes(baileys.jidNormalizedUser(p.id)),
            );
            break;
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

    /** execute command */
    conn.ev.on("messages.upsert", async ({ messages }) => {
      if (!messages[0].message) return;
      let m = await serialize(conn, messages[0], store);

      /** add metadata to store */
      if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0)
        store.groupMetadata = await conn.groupFetchAllParticipating();

      if (m.key && !m.key.fromMe && m.key.remoteJid === "status@broadcast") {
        if (
          m.type === "protocolMessage" &&
          m.message.protocolMessage.type === 0
        )
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
      require("@system/case")(conn, m);
    });

    /** reject call */
    conn.ev.on("call", async (call) => {
      if (call[0].status === "offer") {
        await conn.rejectCall(call[0].id, call[0].from);
      }
    });

    /** clear tmp */
    if (!fs.existsSync("./tmp")) await fs.mkdirSync("./tmp");

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

    /** clear session every 00:00 AM */
    cron.schedule(
      "0 0 * * *",
      () => {
        const sessionFiles = fs.readdirSync(`./${process.env.SESSION_NAME}`);
        if (sessionFiles.length > 0) {
          sessionFiles
            .filter((v) => v !== "creds.json")
            .forEach((v) =>
              fs
                .unlinkSync(`./${process.env.SESSION_NAME}/` + v)
                .then(() =>
                  console.log(
                    Color.cyanBright("[+] Clear all session trash. . ."),
                  ),
                ),
            );
        }
      },
      {
        scheduled: true,
        timezone: process.env.TZ,
      },
    );

    /** save db every 30 seconds */
    setInterval(async () => {
      await mydb
        .write(db)
    }, 60_000);

    /** load plugins directory */
    loadPlugins(conn);
    /** watch plugins after change */
    watchPlugins(conn);
    /** watch library directory */
    loadLibs(conn);
    /** watch library after change */
    watchLibs(conn);
    /** handle & reject error */
    process.on("uncaughtException", console.error);
    process.on("unhandledRejection", console.error);
  };

  connectWA();
})();
