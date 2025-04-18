<p align="center"> <img src="https://komarev.com/ghpvc/?username=yuurahz&label=Repo%20views&color=0e75b6&style=flat" alt="yuurahz" /> </p>

## YOSHIDA-BOT
![Layout](https://files.catbox.moe/vhjl81.jpg)

## Introduction

> **YOSHIDA** is a whatsapp bot with many multifunctional features, using **[BAILEYS](https://github.com/Whiskeysockets/Baileys)** for free
> The addition of interactive AI features that allow for a more engaging and realistic conversation experience ✨.

## Install and run
```Bash
$ npm install
$ npm start
```

## For termux user
```Bash
$ pkg update && pkg upgrade -y
$ pkg install nodejs -y
$ pkg install imagemagick -y
$ pkg install ffmpeg -y
$ pkg install git -y
$ git clone https://github.com/yuurahz/yoshida
$ cd yoshida
$ npm i
$ npm start
```

## Set in .env
```Javascript
TZ= //The time zone you want to use
DATABASE_URL= //your mongodb url (opsional)
PAIRING_STATE= //Boolean
PAIRING_NUMBER= //number to be connected to the bot
```

## pm2 configuration (opsional)
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

## Plugins
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

## For case
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

## Tqto
 [![nando](https://github.com/rifnd.png?size=50)](https://github.com/rifnd) | [![Adi](https://github.com/yuurahz.png?size=50)](https://github.com/yuurahz) | [![Baileys](https://github.com/Whiskeysockets.png?size=50)](https://github.com/Whiskeysockets)
----|----|----
[Nando](https://github.com/rifnd) | [Adi](https://github.com/yuurahz) | [Baileys](https://github.com/Whiskeysockets)
 Inspiration | Developer | Library Provider
