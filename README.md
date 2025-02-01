<p align="center"> <img src="https://komarev.com/ghpvc/?username=yuurahz&label=Repo%20views&color=0e75b6&style=flat" alt="yuurahz" /> </p>

## YOSHIDA-BOT
![Layout](https://files.catbox.moe/iisg2z.jpg)

## Introduction

> - **YOSHIDA** is a whatsapp bot with many multifunctional features, using **BAILEYS** for free
>
> - This script is 100% free, which uses the API from [Yoshida-APIs](https://api.yoshida.my.id)
> - Using the module from [@yoshx/func](https://www.npmjs.com/package/@yoshx/func)

## Set in .env

```Javascript
TZ= //The time zone you want to use
DATABASE_URL= //your mongodb database
PAIRING_STATE= //Boolean
PAIRING_NUMBER= //number to be connected to the bot
```

## pm2 configuration

```Javascript
module.exports = {
  apps: [
    {
      name: "yoshida", //app name for pm2
      script: "./index.js", //main file to run
      node_args: "--max-old-space-size=2048", //maximum memory size
      env: {
        NODE_ENV: "production", //opsional
      },
      env_development: {
        NODE_ENV: "development", //opsional
      },
    },
  ],
};
```

## Install and run

```Javascript
$ npm install
$ npm start
$ npm run pm2 //for using pm2
```

## Plugins run command

```Javascript
module.exports = {
   help: ['command'],
   tags: ['category'],
   command: /^(command)$/i,
   run: async (m, {
      conn
   }) => {
      try {
         // your code
      } catch (e) {
         return conn.reply(m.chat, Func.jsonFormat(e), m)
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

## Plugins Event

```Javascript
module.exports = {
   async before(m, {
      conn
   }) {
      try {
         // your code
      } catch (e) {
         return conn.reply(m.chat, Func.jsonFormat(e), m)
      }
      return true
   }
}
```

---

### Server

- [x] [Heroku](https://heroku.com/) (Recommended)
- [x] VPS/RDP [DigitalOcean](https://digitalocean.com/)
- [x] VPS NAT [HostData](https://hostdata.id/)
- [x] Panel [Optiklink](https://optiklink.com/)

### Database
- [x] [MongoDB](https://mongodb.com/)

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
