<p align="center"> <img src="https://komarev.com/ghpvc/?username=yuurahz&label=Repo%20views&color=0e75b6&style=flat" alt="yuurahz" /> </p>

## YOSHIDA-BOT
![Layout](https://files.catbox.moe/g155d2.jpg)

## Introduction

> **YOSHIDA** is a whatsapp bot with many multifunctional features, using **[BAILEYS](https://github.com/Whiskeysockets/Baileys)** for free

> The addition of interactive AI features that allow for a more engaging and realistic conversation experience ✨.

> Uses a session storage system in PostgresQL and local storage, can be customized by the user.

## Install and run
```Bash
$ npm install
$ npm start
```

## Set in environment variabel
```Javascript
#additional setup
TZ= //The time zone you want to use
DATABASE_URL= //your mongodb url (opsional)
PAIRING_STATE= //Boolean
PAIRING_NUMBER= //number to be connected to the bot

#postgreesql config (visit here: https://console.aiven.io)
POSTGRES_HOST= //your potgree database host
POSTGRES_PASSWORD= //your postgre database pass
POSTGRES_USER= //your postgre database user
POSTGRES_DATABASE= //your postgre databases
POSTGRES_PORT= //your potgre database port
```

## pm2 configuration (optional)
```Javascript
module.exports = {
  apps: [
    {
      name: "yoshida", //app name for pm2
      script: "./index.js", //main file to run
      node_args: "--max-old-space-size=2048", //maximum memory size
      env: {
        NODE_ENV: "production", //optional
      },
      env_development: {
        NODE_ENV: "development", //optional
      },
    },
  ],
};
```

## Plugins execution
```Javascript
module.exports = {
   help: ['display'],
   tags: ['category'],
   command: /^(command)$/i,
   run: async (m, {
      Func
   }) => {
      try {
         // your code
      } catch (e) {
         return m.reply(Func.jsonFormat(e))
      }
   },
   group: Boolean,
   admin: Boolean,
   limit: Boolean,
   premium: Boolean,
   botAdmin: Boolean,
   owner: Boolean
}
```

## Plugins events
```Javascript
module.exports = {
   async before(m, {
      Func
   }) {
      try {
         // your code
      } catch (e) {
         return m.reply(Func.jsonFormat(e))
      }
      return true
   }
}
```

## Case execution
```Javascript
case "tes": {
  m.reply("on!");
  break;
}
```

---

### Server recommended
- [x] [Heroku](https://heroku.com/)
- [x] VPS/RDP [DigitalOcean](https://digitalocean.com/)
- [x] VPS NAT [HostData](https://hostdata.id/)
- [x] Panel [Optiklink](https://optiklink.com/)

### Database
- [x] [MongoDB](https://mongodb.com/) (recommended)
- [x] [PostgreSQL](https://console.aiven.io) (recommended)
---

### Heroku Buildpack (For heroku user)
| BuildPack | LINK |
|-----------|------|
| **FFMPEG** | [![here](https://img.shields.io/badge/Link-here-blue)](https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest) |
| **IMAGEMAGICK** | [![here](https://img.shields.io/badge/Link-here-blue)](https://github.com/DuckyTeam/heroku-buildpack-imagemagick) |

---

## S&K

- Not For Sale (unless you have added some features to it)
- Don't forget give star this repo :)
- Don't use this repository wrong
- Do not use fake panels, usually have bocil JB, use trusted panels, there is a price there is quality

---

## Note
If you experience any problems or errors, please contact us [here.](https://chat.whatsapp.com/HnoKcpzYsKE5y0thEM060h)

## Tqto
 [![nando](https://github.com/rifnd.png?size=50)](https://github.com/rifnd) | [![Adi](https://github.com/yuurahz.png?size=50)](https://github.com/yuurahz) | [![Baileys](https://github.com/Whiskeysockets.png?size=50)](https://github.com/Whiskeysockets) | [![Zaid](https://github.com/ItsxZaid.png?size=50)](https://github.com/ItsxZaid)
----|----|----
[Nando](https://github.com/rifnd) | [Adi](https://github.com/yuurahz) | [Baileys](https://github.com/Whiskeysockets) | [Zaid](https://github.com/ItsxZaid) | Inspiration | Developer | Library Provider | Creator of Postgres session
