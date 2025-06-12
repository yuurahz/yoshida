module.exports = {
  help: ["enable", "disable"],
  tags: ["owner"],
  command: /^(on|off|enable|disable)$/i,
  run: async (m, { conn, isOwner, groupSet, setting }) => {
    if (!isOwner && !m.isAdmin) return;
    let isEnable = /true|enable|(turn)?on|1/i.test(m.command);
    let type = (m.text || "").toLowerCase();
    let isAll = false;
    let isUser = false;
    let g = [
      "game",
      "welcome",
      "antibot",
      "antilink",
      "antivirtex",
      "antisticker",
    ];
    let o = ["self", "debug", "autoread", "groupmode", "privatemode"];
    switch (type) {
      /** group setting */
      case "welcome":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.welcome = isEnable;
        }
        break;
      case "antibot":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.antibot = isEnable;
        }
        break;
      case "antilink":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.antilink = isEnable;
        }
        break;
      case "antivirtex":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.antivirtex = isEnable;
        }
        break;
      case "game":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.game = isEnable;
        }
        break;
      case "antisticker":
        {
          if (!m.isGroup) {
            if (!isOwner) {
              m.reply(mess.owner);
              return false;
            }
          } else if (!m.isAdmin) {
            m.reply(mess.admin);
            return false;
          }
          groupSet.antisticker = isEnable;
        }
        break;

      /** bot setting */
      case "self":
        {
          isAll = true;
          if (!isOwner) {
            m.reply(mess.owner);
            return false;
          }
          setting.self_mode = isEnable;
        }
        break;
      case "autoread":
        {
          isAll = true;
          if (!isOwner) {
            m.reply(mess.owner);
            return false;
          }
          setting.autoread = isEnable;
        }
        break;
      case "debug":
        {
          isAll = true;
          if (!isOwner) {
            m.reply(mess.owner);
            return false;
          }
          setting.debug_mode = isEnable;
        }
        break;
      case "groupmode":
        {
          isAll = true;
          if (!isOwner) {
            m.reply(mess.owner);
            return false;
          }
          setting.group_mode = isEnable;
        }
        break;
      case "privatemode":
        {
          isAll = true;
          if (!isOwner) {
            m.reply(mess.owner);
            return false;
          }
          setting.private_mode = isEnable;
        }
        break;
      default:
        let opt = `乂  *O P T I O N*\n${isOwner ? "\n" + o.map((v) => "  ◦  " + v).join`\n` : ""}${m.isGroup ? "\n" + g.map((v) => "  ◦  " + v).join`\n` : ""}\n\n${footer}`;
        if (!/[01]/.test(m.command)) return m.reply(opt);
    }
    m.reply(
      `*${type}* successfully *${isEnable ? "enable" : "disable"}* ${isAll ? "for this bot" : isUser ? "" : "for this group"}`.trim(),
    );
  },
};
