module.exports = {
  command: /^(menu|help|listmenu|list)$/i,
  run: async (m, { Func, setting, users, plugins }) => {
    let fs = require("fs"),
      perintah = m.text || "tags",
      tagCount = {},
      tagHelpMapping = {};

    let limitedCommands = {};
    let premiumCommands = {};

    Object.keys(plugins)
      .filter((plugin) => !plugin.disabled)
      .forEach((plugin) => {
        const tagsArray = Array.isArray(plugins[plugin].tags)
          ? plugins[plugin].tags
          : [];

        if (tagsArray.length > 0) {
          const helpArray = Array.isArray(plugins[plugin].help)
            ? plugins[plugin].help
            : [plugins[plugin].help];

          const isLimited =
            typeof plugins[plugin].limit !== "undefined" &&
            plugins[plugin].limit > 0;
          const isPremium = plugins[plugin].premium === true;

          helpArray.forEach((cmd) => {
            if (isLimited) limitedCommands[cmd] = true;
            if (isPremium) premiumCommands[cmd] = true;
          });

          tagsArray.forEach((tag) => {
            if (tag) {
              if (tagCount[tag]) {
                tagCount[tag]++;
                tagHelpMapping[tag].push(...helpArray);
              } else {
                tagCount[tag] = 1;
                tagHelpMapping[tag] = [...helpArray];
              }
            }
          });
        }
      });

    let local_size = fs.existsSync("./database.json")
      ? await Func.getSize(fs.statSync("./database.json").size)
      : "";
    let fitur = Object.values(plugins).filter((v) => v.help).length;
    let message = setting.msg
      .replace("+tag", `@${m.sender.replace(/@.+/g, "")}`)
      .replace("+greeting", Func.greeting())
      .replace("+uptime", Func.toDate(process.uptime() * 1000))
      .replace("+mode", setting.group_mode ? "Group only" : "Hybrid")
      .replace(
        "+db",
        /mongo/.test(process.env.DATABASE_STATE)
          ? "MongoDB"
          : `Local : ${local_size}`,
      );

    const legend = "📢 `Keterangan:`\nⓁ︎ = Limit\nⓅ = Premium";

    const formatList = (items, prefix = "") => {
      const lines = items.split("\n");
      return lines
        .map((line, index) => {
          if (index === lines.length - 1) {
            return `${prefix}  └ ${line.trim().replace(/^├\s*/, "").replace(/^└\s*/, "")}`;
          } else {
            return `${prefix}  ├ ${line.trim().replace(/^├\s*/, "").replace(/^└\s*/, "")}`;
          }
        })
        .join("\n");
    };

    const formatCommand = (cmd) => {
      let formattedCmd = cmd;
      let badges = [];

      if (limitedCommands[cmd.replace(m.prefix, "")]) {
        badges.push("Ⓛ︎");
      }

      if (premiumCommands[cmd.replace(m.prefix, "")]) {
        badges.push("Ⓟ");
      }

      if (badges.length > 0) {
        formattedCmd += ` ${badges.join(" ")}`;
      }

      return formattedCmd;
    };

    if (perintah === "tags") {
      const daftarTag = Object.keys(tagCount)
        .sort()
        .map((tag) => `${m.prefix + m.command} ${tag}`)
        .join("\n");

      const formattedDaftarTag = formatList(daftarTag);
      const allMenu = `${m.prefix + m.command} all`;

      const list = `${message}${Func.readMore()}\n\n📃 \`List Menu\`\n  ├ ${allMenu}\n${formattedDaftarTag}\n\n${legend}\n`;

      if (setting.style === 1) {
        m.reply({
          image: { url: setting.cover },
          caption: list,
          contextInfo: { mentionedJid: [m.sender] },
          footer: process.env.FOOTER,
          buttons: [
            {
              buttonId: m.prefix + "faq",
              buttonText: {
                displayText: "— FAQ —",
              },
            },
            {
              buttonId: `${m.prefix + m.command} all`,
              buttonText: {
                displayText: "— ALL FEATURES —",
              },
            },
          ],
          viewOnce: true,
          headerType: 1,
        });
      } else if (setting.style === 2) {
        m.reply(list);
      } else {
        m.reply({
          text: list,
          contextInfo: {
            mentionedJid: Func.parseMention(list),
            externalAdReply: {
              title: `YOSHIDA TECH ${require(process.cwd() + "/package.json").version}`,
              body: "Bots make things easier for you with existing features",
              thumbnailUrl: setting.cover,
              sourceUrl: "",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      }
    } else if (tagCount[perintah]) {
      const daftarHelp = tagHelpMapping[perintah]
        .sort()
        .map((helpItem) => formatCommand(m.prefix + helpItem))
        .join("\n");

      const formattedDaftarHelp = formatList(daftarHelp);
      const messages = `📃 \`${perintah.toUpperCase()}\`\n${formattedDaftarHelp}\n`;

      if (setting.style === 1) {
        m.reply(messages);
      } else if (setting.style === 2) {
        m.reply(messages);
      } else {
        m.reply({
          text: messages,
          contextInfo: {
            mentionedJid: Func.parseMention(messages),
            externalAdReply: {
              title: `YOSHIDA TECH ${require(process.cwd() + "/package.json").version}`,
              body: "Artificial Inteligence, The begining of robot era",
              thumbnailUrl: setting.cover,
              sourceUrl: "",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      }
    } else if (perintah === "all") {
      const allTagsAndHelp = Object.keys(tagCount)
        .sort()
        .map((tag) => {
          const daftarHelp = tagHelpMapping[tag]
            .sort()
            .map((helpItem) => formatCommand(m.prefix + helpItem))
            .join("\n");

          const formattedHelp = formatList(daftarHelp);
          return `\n📃 \`${tag.toUpperCase()}\`\n${formattedHelp}`;
        })
        .join("\n");

      const kabeh = `Welcome @${m.sender.replace(/@.+/g, "")} 🙌🏻\nNeed Help?, Here is a list of available commands\n\nTotal Command:\n\`${fitur}\` More or less\n${Func.readMore()}\n${allTagsAndHelp}\n`;

      if (setting.style === 1) {
        m.reply({
          text: kabeh,
          contextInfo: { mentionedJid: [m.sender] },
          footer: process.env.FOOTER,
          buttons: [
            {
              buttonId: `${m.prefix + m.command}`,
              buttonText: {
                displayText: "— BACK TO MENU —",
              },
            },
          ],
          viewOnce: true,
          headerType: 1,
        });
      } else if (setting.style === 2) {
        m.reply(kabeh);
      } else {
        m.reply({
          text: kabeh,
          contextInfo: {
            mentionedJid: Func.parseMention(kabeh),
            externalAdReply: {
              title: `YOSHIDA TECH ${require(process.cwd() + "/package.json").version}`,
              body: "Artificial Inteligence, The begining of robot era",
              thumbnailUrl: setting.cover,
              sourceUrl: "",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      }
    } else {
      return m.reply(
        `Perintah \`${m.prefix + m.command} ${perintah}\` Tidak Terdaftar Di Menu!`,
      );
    }
  },
};
