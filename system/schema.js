module.exports = (m) => {
  let isNumber = (x) => typeof x === "number" && !isNaN(x);
  let user = db.users[m.sender];
  if (typeof user !== "object") db.users[m.sender] = {};
  if (user) {
    if (!isNumber(user.exp)) user.exp = 100;
    if (!isNumber(user.limit)) user.limit = process.env.LIMIT;
    if (!isNumber(user.joinlimit)) user.joinlimit = 1;
    if (!isNumber(user.money)) user.money = 100;
    if (!isNumber(user.bank)) user.bank = 100;
    if (!isNumber(user.lastclaim)) user.lastclaim = 0;
    if (!("registered" in user)) user.registered = false;
    if (!user.registered) {
      if (!("name" in user)) user.name = "";
      if (!isNumber(user.saldo)) user.saldo = 0;
      if (!isNumber(user.age)) user.age = 1;
      if (!isNumber(user.unreglast)) user.unreglast = 0;
      if (!isNumber(user.regis_time)) user.regis_time = -1;
    }
    if (!isNumber(user.afk)) user.afk = -1;
    if (!("afkReason" in user)) user.afkReason = "";
    if (!("pasangan" in user)) user.pasangan = "";
    if (!("banned" in user)) user.banned = false;
    if (!("premium" in user)) user.premium = false;
    if (!isNumber(user.expired)) user.expired = 0;
    if (!isNumber(user.ban_time)) user.ban_time = 0;
    if (!isNumber(user.ban_temporary)) user.ban_temporary = 0;
    if (!isNumber(user.warn)) user.warn = 0;
    if (!isNumber(user.level)) user.level = 0;
    if (!("role" in user)) user.role = "Newbie";
    if (!isNumber(user.hit)) user.hit = 0;
    if (!isNumber(user.lastseen)) user.lastseen = 0;
    if (!("activity" in user)) user.activity = {};
  } else {
    db.users[m.sender] = {
      exp: 100,
      limit: process.env.LIMIT,
      joinlimit: 1,
      expired: 0,
      money: 100,
      bank: 100,
      lastclaim: 0,
      registered: false,
      name: "",
      saldo: 0,
      age: 1,
      unreglast: 0,
      regis_time: -1,
      afk: -1,
      afkReason: "",
      pasangan: "",
      banned: false,
      premium: false,
      warn: 0,
      level: 0,
      role: "Newbie",
      hit: 0,
      lastseen: 0,
      activity: {},
    };
  }

  if (m.isGroup) {
    let group = db.groups[m.chat];
    if (typeof group !== "object") db.groups[m.chat] = {};
    if (group) {
      if (!isNumber(group.activity)) group.activity = 0;
      if (!isNumber(group.expired)) group.expired = 0;
      if (!("sWelcome" in group)) group.sWelcome = "";
      if (!("sBye" in group)) group.sBye = "";
      if (!("isBanned" in group)) group.isBanned = false;
      if (!("welcome" in group)) group.welcome = false;
      if (!("antilink" in group)) group.antilink = false;
      if (!("antivirtex" in group)) group.antivirtex = false;
      if (!("antisticker" in group)) group.antisticker = false;
      if (!("antibot" in group)) group.antibot = false;
      if (!("stay" in group)) group.stay = false;
      if (!("member" in group)) group.member = {};
    } else {
      db.groups[m.chat] = {
        activity: 0,
        expired: 0,
        sWelcome: "",
        sBye: "",
        isBanned: false,
        welcome: false,
        antilink: false,
        antivirtex: false,
        antisticker: false,
        antibot: false,
        stay: false,
        member: {},
      };
    }
  }

  let chat = db.chats[m.chat];
  if (typeof chat !== "object") db.chats[m.chat] = {};
  if (chat) {
    if (!isNumber(chat.chat)) chat.chat = 0;
    if (!isNumber(chat.lastchat)) chat.lastchat = 0;
    if (!isNumber(chat.command)) chat.command = 0;
  } else {
    db.chats[m.chat] = {
      chat: 0,
      lastchat: 0,
      command: 0,
    };
  }

  let setting = db.setting;
  if (typeof setting !== "object") db.setting = {};
  if (setting) {
    if (!isNumber(setting.style)) setting.style = 0;
    if (!isNumber(setting.lastreset)) setting.lastreset = new Date() * 1;
    if (!("autoread" in setting)) setting.autoread = true;
    if (!("self_mode" in setting)) setting.self_mode = false;
    if (!("debug_mode" in setting)) setting.debug_mode = false;
    if (!("group_mode" in setting)) setting.group_mode = false;
    if (!("private_mode" in setting)) setting.private_mode = false;
    if (!("stick_pack" in setting)) setting.stick_pack = "@yoshida.js";
    if (!("stick_auth" in setting))
      setting.stick_auth = "linktr.ee/yoshida.bot";
    if (!("cmd_blocked" in setting)) setting.cmd_blocked = [];
    if (!("pluginDisable" in setting)) setting.pluginDisable = [];
    if (!("owners" in setting)) setting.owners = process.env.OWNER || [];
    if (!("cover" in setting))
      setting.cover = "https://files.catbox.moe/xxa4gz.jpg";
    if (!("link" in setting))
      setting.link = "https://whatsapp.com/channel/0029VaBB5zLF1YlNMoA6YD0b";
    if (!("msg" in setting))
      setting.msg =
        "Hi +tag. I am an automated system (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.\n\n◦ *Database* : +db\n◦ *Library* : Baileys\n\nIf you find an error or want to upgrade premium plan contact the owner.";
  } else {
    db.setting = {
      style: 0,
      lastreset: new Date() * 1,
      autoread: true,
      self_mode: false,
      debug_mode: false,
      group_mode: false,
      private_mode: false,
      stick_pack: "@yoshida.js",
      stick_auth: "linktr.ee/yoshida.bot",
      cmd_blocked: [],
      pluginDisable: [],
      owners: process.env.OWNER || [],
      cover: "https://files.catbox.moe/xxa4gz.jpg",
      link: "https://whatsapp.com/channel/0029VaBB5zLF1YlNMoA6YD0b",
      msg: "Hi +tag. I am an automated system (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.\n\n◦ *Database* : +db\n◦ *Library* : Baileys\n\nIf you find an error or want to upgrade premium plan contact the owner.",
    };
  }
};
