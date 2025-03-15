const fs = require("fs");
const cron = require("node-cron");
const { Function: Func, Plugins, Color } = new (require("@yoshx/func"))();
const { plugins } = Plugins;

module.exports = async (conn, m, store) => {
  try {
    require("@system/schema")(m);
    const users = db.users[m.sender];
    const groupSet = db.groups[m.chat];
    const chats = db.chats[m.chat];
    const setting = db.setting;
    const isOwner =
      [conn.decodeJid(conn.user.id).split`@`[0], ...setting.owners]
        .map((v) => v + "@s.whatsapp.net")
        .includes(m.sender) || m.fromMe;
    const isPrems = users.premium || isOwner;
    if (setting.autoread) {
      await conn.sendPresenceUpdate("available", m.chat);
      await conn.readMessages([m.key]);
    }
    if (m.isBot) return;
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
        Object.values(db.users).forEach((v) => {
          if (v.limit < process.env.LIMIT && !v.premium) {
            v.limit = process.env.LIMIT;
          }
        });
        Object.entries(db.stats).map(([_, prop]) => (prop.today = 0));
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
      const quoted = m.isQuoted ? m.quoted : m;
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
            quoted,
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
        users.usebot = Date.now();
        users.exp += Math.ceil(Math.random() * 10);
        m.plugin = name;
        if (m.chat in db.groups || m.sender in db.users) {
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
          ![
            "profile.js",
            "sewa.js",
            "_creator.js",
            "_rules.js",
            "_respon.js",
            "regist.js",
          ].includes(name.split("/").pop()) &&
          chats &&
          !isPrems &&
          !users.banned &&
          new Date() * 1 - chats.lastchat < process.env.TIMEOUT
        )
          continue;
        if (
          !m.isGroup &&
          ![
            "profile.js",
            "sewa.js",
            "_creator.js",
            "_rules.js",
            "_respon.js",
            "regist.js",
          ].includes(name.split("/").pop()) &&
          chats &&
          !isPrems &&
          !users.banned &&
          setting.group_mode &&
          !Object.values(
            (await conn.groupMetadata(process.env.ID_GC)).participants,
          ).find((users) => users.id == m.sender)
        ) {
          m.reply(mess["gconly"].replace("+link", setting.link)).then(
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
        } else if (plugin.premium && !isPrems) {
          m.reply(mess.premium);
          continue;
        } else if (plugin.group && !m.isGroup) {
          m.reply(mess.group);
          continue;
        } else if (plugin.botAdmin && !m.isBotAdmin) {
          m.reply(mess.botAdmin);
          continue;
        } else if (plugin.admin && !m.isAdmin) {
          m.reply(mess.admin);
          continue;
        } else if (plugin.private && m.isGroup) {
          m.reply(mess.private);
          continue;
        } else if (plugin.register && users.registered === false) {
          m.reply(mess.register);
          continue;
        } else if (plugin.game && groupSet.game === false) {
          m.reply(mess.game);
          continue;
        } else if (plugin.rpg && groupSet.rpg === false) {
          m.reply(mess.rpg);
          continue;
        } else if (plugin.nsfw && groupSet.nsfw === false) {
          m.reply(mess.nsfw);
          continue;
        } else if (plugin.limit && users.limit < plugin.limit * 1) {
          m.reply(
            `Limit penggunaan anda telah mencapai batas, silahkan tunggu pukul *00:00* untuk mereset limit anda, atau upgrade ke premium untuk mendapatkan *unlimited* limit.`,
          ).then(() => (users.premium = false));
          continue;
        } else if (!isPrems && plugin.limit && users.limit > 0) {
          const limit = plugin.limit == "Boolean" ? 1 : plugin.limit;
          if (users.limit >= limit) {
            users.limit -= limit;
          } else {
            m.reply(
              Func.texted(
                "bold",
                `Your limit is not enough to use this feature.`,
              ),
            );
            continue;
          }
        } else if (plugin.level > users.level) {
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
        } catch (e) {
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
    let stats = db.stats;
    if (m) {
      if (m.plugin) {
        let now = +new Date();
        let pluginName = m.plugin.split("/").pop().replace(".js", "");
        let stat = stats[pluginName] || { hitstat: 0, today: 0, lasthit: 0 };
        stat.hitstat += 1;
        stat.today += 1;
        stat.lasthit = now;
        stats[pluginName] = stat;
      }
    }
    if (m.message && !m.fromMe) {
      console.log("\x1b[30m--------------------\x1b[0m");
      console.log(Color.bgRed(` Console Message Info `));
      console.log(
        `   - Date: ${new Date().toLocaleString("id-ID")} WIB \n` +
          `   - Message: ${m.body || m.type} \n` +
          `   - Sender Number: ${await conn.getName(m.sender)} \n` +
          `   - Sender Name: ${m.name} \n` +
          `   - Sender ID: ${m.id}`,
      );
      if (m.isGroup) {
        console.log(
          `   - Group: ${await conn.getName(m.chat)} \n` +
            `   - GroupID: ${m.chat}`,
        );
      }
    }
  }
};

fs.watchFile(require.resolve(__filename), () => {
  fs.unwatchFile(require.resolve(__filename));
  console.log(Color.cyanBright("Update ~ 'handler.js'"));
  delete require.cache[require.resolve(__filename)];
});
