<p align="center"> <img src="https://komarev.com/ghpvc/?username=yuurahz&label=Repo%20views&color=0e75b6&style=flat" alt="yuurahz" /> </p>

## YOSHIDA-BOT
![Layout](https://files.catbox.moe/iisg2z.jpg)

## Introduction

> **YOSHIDA** is a whatsapp bot with many multifunctional features, using **[BAILEYS](https://github.com/Whiskeysockets/Baileys)** for free

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yuurahz/yoshida.git
    cd yoshida
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Start the bot:

    ```bash
    npm start
    or
    node index.js
    ```

## Install and run using PM2
```Bash
1. npm install -g pm2
2. npm run pm2 / pm2 start index.js
```

## For termux user
```Bash
1. pkg update && pkg upgrade -y
2. pkg install nodejs -y
3. pkg install imagemagick -y
4. pkg install ffmpeg -y
5. pkg install git -y
6. git clone https://github.com/yuurahz/yoshida
7. cd yoshida
8. npm install
9. npm start
```

## Run on VPS (Linux)
```Bash
1. sudo apt update && apt upgrade
2. sudo apt install nodejs -y
3. sudo apt install git -y
4. sudo apt install ffmpeg -y (opsional)
```

## Install nvm for custom nodejs version
```Bash
1. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
2. source ~/.bashrc
3. nvm install node
```

## Set in .env

```Javascript
TZ= //The time zone you want to use
DATABASE_URL= //your mongodb url
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
        NODE_ENV: "production", //optional
      },
      env_development: {
        NODE_ENV: "development", //optional
      },
    },
  ],
};
```

## calling command

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

## Events

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

### Server recommended

- [x] [Heroku](https://heroku.com/)
- [x] VPS/RDP [DigitalOcean](https://digitalocean.com/)
- [x] VPS NAT [HostData](https://hostdata.id/)
- [x] Panel [Optiklink](https://optiklink.com/)

### Database
- [x] [MongoDB](https://mongodb.com/)

---

### Heroku Buildpack (if you are a heroku user)

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
