(async () => {
  require("events").EventEmitter.defaultMaxListeners = 500;
  require("module-alias/register");
  require("@system/setting");
  const fs = require("fs");
  const pino = require("pino");
  const cron = require("node-cron");
  const { Boom } = require("@hapi/boom");
  const NodeCache = require("node-cache");
  const baileys = require("@whiskeysockets/baileys");
  const { Client, serialize } = require("@system/socket");
  const { Local, PostgreSQL } = require("@system/provider");
  const { usePostgreSQLAuthState } = require("postgres-baileys");
  const {
    Color,
    Libs,
    Plugins,
    Function: Func,
  } = new (require("@yoshx/func"))();
  const { loadPlugins, watchPlugins } = Plugins;
  const { loadLibs, watchLibs } = Libs;

  /** postgreSQL cfg */
  const postgreSQLConfig = {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.POSTGRES_SSL.replace(/"""/g, ""),
    },
  };

  /** database options */
  const mydb = /json/i.test(process.env.DATABASE_STATE)
    ? new Local()
    : /postgres/i.test(process.env.DATABASE_STATE)
      ? new PostgreSQL(postgreSQLConfig, "db_bot")
      : process.exit();

  /** database init */
  global.db = await mydb.read();
  if (!db || Object.keys(db).length === 0) {
    db = {
      users: {},
      groups: {},
      chats: {},
      setting: {},
      stats: {},
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

  /** Session State Configuration Function */
  const getSessionState = async () => {
    const sessionType = process.env.SESSION_TYPE;

    if (
      sessionType.toLowerCase() === "postgresql" ||
      sessionType.toLowerCase() === "postgres"
    ) {
      console.log(Color.cyan("[ SESSION ] Using PostgreSQL session storage"));

      try {
        const { state, saveCreds, deleteSession } =
          await usePostgreSQLAuthState(
            postgreSQLConfig,
            process.env.SESSION_NAME,
          );

        return {
          type: "postgresql",
          state,
          saveCreds,
          deleteSession,
        };
      } catch (error) {
        console.log(
          Color.red(
            "[ SESSION ] PostgreSQL connection failed, falling back to local storage",
          ),
        );
        console.error(error);
        return getLocalSessionState();
      }
    } else {
      return getLocalSessionState();
    }
  };

  /** Local Session State Function */
  const getLocalSessionState = async () => {
    console.log(Color.cyan("[ SESSION ] Using local file session storage"));

    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      `./${process.env.SESSION_NAME}`,
    );

    const deleteSession = async () => {
      try {
        const sessionPath = `./${process.env.SESSION_NAME}`;
        if (fs.existsSync(sessionPath)) {
          await fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(
            Color.green("[ SESSION ] Local session deleted successfully"),
          );
        }
      } catch (error) {
        console.error(
          Color.red("[ SESSION ] Error deleting local session:"),
          error,
        );
      }
    };

    return {
      type: "local",
      state,
      saveCreds,
      deleteSession,
    };
  };

  /** connect to websocket */
  const connectWA = async () => {
    const store = await baileys.makeInMemoryStore({
      logger,
    });

    const sessionConfig = await getSessionState();
    const { state, saveCreds, deleteSession } = sessionConfig;

    const { version, isLatest } = await baileys.fetchLatestBaileysVersion();
    console.log(
      Color.cyan(`-- Using WA v${version.join(".")}, isLatest: ${isLatest} --`),
    );
    console.log(
      Color.cyan(`-- Session Type: ${sessionConfig.type.toUpperCase()} --`),
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
      browser: baileys.Browsers.ubuntu("Edge"),
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
      cachedGroupMetadata: async (jid) => await groupCache.get(jid),
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
        const code = await conn.requestPairingCode(phoneNumber, "YOSHIDA1");
        console.log(
          `Pairing code: \x1b[32m${code?.match(/.{1,4}/g)?.join("-") || code}\x1b[39m`,
        );
      } catch (e) {
        console.error("[+] Gagal mendapatkan kode pairing", e);
        process.exit();
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
              await deleteSession();
              console.log(Color.green("[+] Session removed!!"));
              process.send("reset");
            } catch {
              console.log(Color.cyan("[+] Session not found!!"));
            }
            break;
          case 403:
            console.log(Color.red(`[+] Your WhatsApp Has Been Baned :D`));
            await deleteSession();
            process.exit();
            break;
          case 405:
            try {
              console.log(
                Color.cyan("[+] Session Not Logged In.. Recreate session..."),
              );
              await deleteSession();
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

    /** participants update with metadata and greetings */
    conn.ev.on(
      "group-participants.update",
      async ({ id, participants, action }) => {
        const group = db.groups[id] || {};
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

        if (!db.setting.self_mode && group.welcome) {
          switch (action) {
            case "add":
            case "remove":
            case "leave":
            case "invite":
            case "invite_v4":
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

                conn.reply(id, teks, null, {
                  ephemeralExpiration: groupMetadata.ephemeralDuration,
                });
              }
              break;
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

      require("@system/case")(conn, m);
      require("@system/handler")(conn, m, store, mydb);
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

    /** save db every 30 seconds */
    setInterval(async () => {
      await mydb.write(db);
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
