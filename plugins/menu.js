module.exports = {
  command: /^(menu|help|listmenu|list)$/i,
  run: async (m, { Func, setting, users, plugins }) => {
    let fs = require("fs"),
      perintah = m.text || "tags",
      tagCount = {},
      tagHelpMapping = {};

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
      .replace(
        "+db",
        /mongo/.test(process.env.DATABASE_STATE)
          ? "MongoDB"
          : `Local : ${local_size}`,
      );
    if (perintah === "tags") {
      const daftarTag = Object.keys(tagCount)
        .sort()
        .join("\n│ ◦ " + m.prefix + m.command + "  ");
      let list = `${message}${Func.readMore()}\n\n*— List Menu*\n│ ◦ ${m.prefix + m.command} all\n│ ◦ ${m.prefix + m.command} ${daftarTag}\n└──`;
      if (setting.style === 1) {
        m.reply({
          text: list,
          footer,
          buttons: [
            {
              buttonId: m.prefix + "run",
              buttonText: {
                displayText: "ping",
              },
            },
            {
              buttonId: `${m.prefix + m.command} all`,
              buttonText: {
                displayText: "all menu",
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
              showAdAttribution: true,
              title: `YOSHIDA.BOT ${require(process.cwd() + "/package.json").version}`,
              body: "Bots make things easier for you with existing features",
              thumbnailUrl: setting.cover,
              sourceUrl: "https://api.yoshida.my.id",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
      }
    } else if (tagCount[perintah]) {
      const daftarHelp = tagHelpMapping[perintah]
        .sort()
        .map((helpItem, index) => {
          return `${m.prefix + helpItem}`;
        })
        .join("\n│ ◦" + " ");
      const messages = `*— MENU ${perintah.toUpperCase()}*\n│ ◦ ${daftarHelp}\n└──`;
      if (setting.style === 1) {
        m.reply({
          text: messages,
          footer,
          buttons: [
            {
              buttonId: `${m.prefix + m.command} all`,
              buttonText: {
                displayText: "all menu",
              },
            },
          ],
          viewOnce: true,
          headerType: 1,
        });
      } else if (setting.style === 2) {
        m.reply(messages);
      } else {
        m.reply({
          text: messages,
          contextInfo: {
            mentionedJid: Func.parseMention(messages),
            externalAdReply: {
              showAdAttribution: true,
              title: `YOSHIDA.BOT ${require(process.cwd() + "/package.json").version}`,
              body: "Artificial Inteligence, The begining of robot era",
              thumbnailUrl: setting.cover,
              sourceUrl: "https://api.yoshida.my.id",
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
            .map((helpItem, index) => {
              return `${m.prefix + helpItem}`;
            })
            .join("\n│ ◦" + " ");
          return `\n*— ${tag.toUpperCase()}*\n│ ◦ ${daftarHelp}\n└──`;
        })
        .join("\n");
      let kabeh = `Welcome @${m.sender.replace(/@.+/g, "")} 🙌🏻\nNeed Help?, Here is a list of available commands\n\nTotal Command:\n\`${fitur}\` More or less\n${Func.readMore()}\n${allTagsAndHelp}`;
      if (setting.style === 1) {
        m.reply({
          text: kabeh,
          footer,
          buttons: [
            {
              buttonId: `${m.prefix + m.command}`,
              buttonText: {
                displayText: "back to menu",
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
              showAdAttribution: true,
              title: `YOSHIDA.BOT ${require(process.cwd() + "/package.json").version}`,
              body: "Artificial Inteligence, The begining of robot era",
              thumbnailUrl: setting.cover,
              sourceUrl: "https://api.yoshida.my.id",
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
