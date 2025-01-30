const cron = require("node-cron");
const { unwatchFile, watchFile } = require("fs");
const { Function: Func, Plugins, Color } = new (require("@yoshx/func"))();
const { plugins } = Plugins;

module.exports = async (conn, m, store) => {
  try {
    m.exp = 0;
    m.limit = false;
    require("@system/schema")(m);
    const users = db.data.users[m.sender];
    const groupSet = db.data.groups[m.chat];
    const chats = db.data.chats[m.chat];
    const setting = db.data.setting;
    const isOwner =
      [conn.decodeJid(conn.user.id).split`@`[0], ...setting.owners]
        .map((v) => v + "@s.whatsapp.net")
        .includes(m.sender) || m.fromMe;
    const isPrems = users.premium || isOwner;
    if (m.isBot) return;
    if (setting.autoread) await conn.readMessages([m.key]);
    if (setting.debug_mode && !m.fromMe && isOwner)
      await m.reply(Func.jsonFormat(m));
    if (
      m.isGroup &&
      !groupSet.stay &&
      new Date() * 1 >= groupSet.expired &&
      groupSet.expired != 0
    ) {
      return conn
        .reply(
          m.chat,
          Func.texted(
            "bold",
            "Bot time has expired and will leave from this group, thank you.",
            null,
            {
              mentions: m.metadata.participants.map((v) => v.id),
            },
          ),
        )
        .then(async () => {
          groupSet.expired = 0;
          await Func.delay(3000).then(() => conn.groupLeave(m.chat));
        });
    }
    if (users && new Date() * 1 >= users.expired && users.expired != 0) {
      return conn
        .reply(
          m.sender,
          Func.texted(
            "bold",
            "Your premium package has expired, thank you for buying and using our service.",
          ),
        )
        .then(async () => {
          users.premium = false;
          users.expired = 0;
          users.limit = process.env.LIMIT;
        });
    }
    cron.schedule(
      "00 00 * * *",
      () => {
        setting.lastreset = Date.now();
        Object.values(db.data.users).forEach((v) => {
          if (v.limit < process.env.LIMIT && !v.premium) {
            v.limit = process.env.LIMIT;
          }
        });
        Object.entries(db.data.stats).map(([_, prop]) => (prop.today = 0));
      },
      {
        scheduled: true,
        timezone: process.env.TZ,
      },
    );
    if (m.isGroup) groupSet.activity = new Date() * 1;
    if (users) {
      users.lastseen = new Date() * 1;
    }
    if (chats) {
      chats.chat += 1;
      chats.lastseen = new Date() * 1;
    }
    if (m.isGroup && !m.fromMe) {
      let now = new Date() * 1;
      if (!groupSet.member[m.sender]) {
        groupSet.member[m.sender] = {
          lastseen: now,
          warning: 0,
        };
      } else {
        groupSet.member[m.sender].lastseen = now;
      }
    }
    for (let name in plugins) {
      let plugin;
      if (typeof plugins[name].run === "function") {
        let runner = plugins[name];
        plugin = runner.run;
        for (let prop in runner) {
          if (prop !== "run") {
            plugin[prop] = runner[prop];
          }
        }
      } else {
        plugin = plugins[name];
      }
      if (!plugin) continue;
      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(conn, m);
        } catch (e) {
          console.error(e);
        }
      }
      const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      let _prefix = plugin.customPrefix ? plugin.customPrefix : m.prefix;
      let match = (
        _prefix instanceof RegExp
          ? [[_prefix.exec(m.body), _prefix]]
          : Array.isArray(_prefix)
            ? _prefix.map((p) => {
                let re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
                return [re.exec(m.body), re];
              })
            : typeof _prefix === "string"
              ? [
                  [
                    new RegExp(str2Regex(_prefix)).exec(m.body),
                    new RegExp(str2Regex(_prefix)),
                  ],
                ]
              : [[[], new RegExp()]]
      ).find((p) => p[1]);
      if (typeof plugin.before === "function")
        if (
          await plugin.before.call(conn, m, {
            conn,
            Func,
            store,
            users,
            chats,
            setting,
            plugins,
            isOwner,
            isPrems,
            groupSet,
          })
        )
          continue;
      if (typeof plugin !== "function") continue;
      let usedPrefix;
      if ((usedPrefix = (match[0] || "")[0])) {
        let noPrefix = m.body.replace(usedPrefix, "");
        let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
        let quoted = m.isQuoted ? m.quoted : m;
        command = (command || "").toLowerCase();
        let isAccept =
          plugin.command instanceof RegExp
            ? plugin.command.test(command)
            : Array.isArray(plugin.command)
              ? plugin.command.some((cmd) =>
                  cmd instanceof RegExp ? cmd.test(command) : cmd === command,
                )
              : typeof plugin.command === "string"
                ? plugin.command === command
                : false;
        if (!isAccept) continue;
        users.hit += 1;
        users.usebot = Date.now();
        m.exp += Math.ceil(Math.random() * 10);
        m.plugin = name;
        if (m.chat in db.data.groups || m.sender in db.data.users) {
          if (
            !["unbanned.js"].includes(name.split("/").pop()) &&
            groupSet &&
            groupSet.isBanned
          )
            return;
          if (
            !["unbanned.js"].includes(name.split("/").pop()) &&
            users &&
            users.banned
          )
            return;
        }
        if (setting.self_mode && !isOwner && !m.fromMe) continue;
        if (setting.private_mode && !isOwner && !m.fromMe && m.isGroup)
          continue;
        if (
          !m.isGroup &&
          !["_creator.js"].includes(name.split("/").pop()) &&
          chats &&
          !isPrems &&
          !users.banned &&
          new Date() * 1 - chats.lastchat < process.env.TIMEOUT
        )
          continue;
        if (
          !m.isGroup &&
          !["_creator.js"].includes(name.split("/").pop()) &&
          chats &&
          !users.banned &&
          setting.group_mode &&
          !Object.values(
            (await store.groupMetadata[process.env.ID_GC]).participants,
          ).find((users) => users.id == m.sender)
        ) {
          m.reply(mess.gconly.replace("+link", setting.link)).then(
            async () => (chats.lastchat = new Date() * 1),
          );
          continue;
        }
        if (setting.pluginDisable.includes(name.split("/").pop()) && !isOwner) {
          m.reply(mess.blocked);
          continue;
        }
        if (setting.cmd_blocked.includes(command) && !isOwner) {
          m.reply(mess.blocked);
          continue;
        }
        if (plugin.owner && !isOwner) {
          m.reply(mess.owner);
          continue;
        }
        if (plugin.premium && !isPrems) {
          m.reply(mess.premium);
          continue;
        }
        if (plugin.group && !m.isGroup) {
          m.reply(mess.group);
          continue;
        } else if (plugin.botAdmin && !m.isBotAdmin) {
          m.reply(mess.botAdmin);
          continue;
        } else if (plugin.admin && !m.isAdmin) {
          m.reply(mess.admin);
          continue;
        }
        if (plugin.private && m.isGroup) {
          m.reply(mess.private);
          continue;
        }
        if (plugin.register && users.registered === false) {
          m.reply(mess.register);
          continue;
        }
        let xp = "exp" in plugin ? parseInt(plugin.exp) : 25;
        if (xp > 999) m.reply("Cheat?");
        else m.exp += xp;
        if (!isPrems && plugin.limit && users.limit < plugin.limit * 1) {
          m.reply(
            `Limit penggunaan anda telah mencapai batas! silahkan tunggu pukul *00:00* untuk mereset limit anda, atau upgrade ke premium untuk mendapatkan *unlimited* limit`,
          );
          continue;
        }
        if (plugin.level > users.level) {
          m.reply(
            `level *${plugin.level}* is required to use this command. Your level *${users.level}*`,
          );
          continue;
        }
        let extra = {
          conn,
          Func,
          store,
          users,
          chats,
          setting,
          quoted,
          plugins,
          isOwner,
          isPrems,
          groupSet,
        };
        try {
          await plugin.call(conn, m, extra);
          if (!isPrems) m.limit = m.limit || plugin.limit || false;
        } catch (e) {
          m.error = e;
          console.error(e);
          if (e) {
            let teks = Func.jsonFormat(e);
            if (teks.match("rate-overlimit")) return;
            if (e.name)
              conn.reply(
                process.env.OWNER + "@s.whatsapp.net",
                `Telah terjadi Error pada Bot

*- Nama Fitur :* ${m.plugin}
*- Nama Pengirim :* ${m.name} ${m.isGroup ? `*${await conn.getName(m.chat)}*` : ""}

「 *ERROR LOG* 」 
${teks}`.trim(),
                null,
              );
          }
          m.react("✖️");
        } finally {
          if (typeof plugin.after === "function") {
            try {
              await plugin.after.call(conn, m, extra);
            } catch (e) {
              console.error(e);
            }
          }
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    let user,
      stats = db.data.stats;
    if (m) {
      if (m.sender && (user = db.data.users[m.sender])) {
        user.exp += m.exp;
        user.limit -= m.limit * 1;
      }
      let now = +new Date();
      if (m.plugin) {
        let pluginName = m.plugin.split("/").pop().replace(".js", "");
        let stat = stats[pluginName] || {
          hitstat: 0,
          today: 0,
          lasthit: 0,
          sender: m.sender,
          lastDate: "",
        };
        stat.hitstat += 1;
        stat.today += 1;
        stat.lasthit = now;
        stat.lastDate = new Date(now).toDateString();
        stats[pluginName] = stat;
      }
    }
    if (m.message && !m.isBot) {
      console.log(
        Color.cyan("From"),
        Color.cyan(conn.getName(m.chat)),
        Color.blueBright(m.chat),
      );
      console.log(
        Color.yellowBright("Chat"),
        Color.yellowBright(
          m.isGroup
            ? `Group (${m.sender} : ${conn.getName(m.sender)})`
            : "Private",
        ),
      );
      console.log(
        Color.cyanBright("Message :"),
        Color.cyanBright(m.body || m.type),
      );
    }
  }
};

watchFile(require.resolve(__filename), () => {
  unwatchFile(require.resolve(__filename));
  console.log(Color.cyanBright("Update ~ 'handler.js'"));
  delete require.cache[require.resolve(__filename)];
});
