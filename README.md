# YOSHIDA‑BOT 🤖

**Lightweight WhatsApp Bot powered by Baileys**  
Free to use, flexible, and built on top of Yoshida‑APIs and @yoshx/func

---

## 🔍 Features

- Completely **free** implementation using *Yoshida‑APIs*
- Built with the **Baileys** WhatsApp Web API library
- Supports modular **plugins** and event handlers for automation
- Easy to deploy and manage

---

## 🗂️ Repository Structure

```

/
├── library/           - Core logic and helper modules
├── plugins/           - Command-based plugin modules
├── system/            - Internal system logic
├── index.js           - Main script entry point
├── machine.js         - State or machine logic
├── ecosystem.config.js - pm2 deployment config
├── .env               - Environment configuration
└── package.json       - Project metadata and dependencies

````

---

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
TZ=<Your Time Zone>
PAIRING_STATE=<true|false>
PAIRING_NUMBER=<Phone number to connect/apply pairing>
````

### pm2 Deployment (`ecosystem.config.js`)

```js
module.exports = {
  apps: [
    {
      name: "yoshida",
      script: "./index.js",
      node_args: "--max-old-space-size=2048",
      env: {
        NODE_ENV: "production"
      },
      env_development: {
        NODE_ENV: "development"
      }
    }
  ]
}
```

---

## 🚀 Installation & Setup

```bash
git clone https://github.com/yuurahz/yoshida.git
cd yoshida
npm install
```

### Running the Bot

* **Development mode**

  ```bash
  npm start
  ```

* **With pm2**

  ```bash
  npm run pm2
  ```

---

## 🧩 Developing Plugins

A basic plugin structure looks like:

```js
module.exports = {
  help: ['command'],
  tags: ['category'],
  command: /^(command)$/i,
  run: async (m, { conn }) => {
    try {
      // Plugin logic here
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

## 🧠 Events (“before” handlers)

```js
module.exports = {
  async before(m, { conn }) {
    try {
      // Pre-processing logic
    } catch (e) {
      return conn.reply(m.chat, Func.jsonFormat(e), m)
    }
    return true
  }
}
```

---

## 🛠️ Deployment Suggestions

* **Heroku** (recommended)
* **VPS / RDP** (e.g. DigitalOcean)
* **VPS NAT configurations**
* **Optiklink Panel**

---

## 🗄️ Database

* Supported: **MongoDB**

---

## 📜 License & Usage Terms

* **Free to use**, unless you fork and significantly enhance or monetize it (please indicate changes).
* Please **star ⭐ this repository** if you find it useful.
* Use responsibly and don’t distribute unauthorized modified versions.

---

## 🎉 Acknowledgements & Credits

| Role             | Contributor |
| ---------------- | ----------- |
| Inspiration      | —           |
| Developer        | yuurahz     |
| Library Provider | @yoshx/func |

---

## 🧾 Summary

**YOSHIDA‑BOT** is a fully free, modular WhatsApp bot built on the Baileys platform. It prioritizes plugin flexibility and ease of deployment. This README provides everything needed to install, configure, develop plugins, and deploy the bot.

---

### 💡 Ideas for Improvements

* Add API documentation for available Yoshida‑API calls
* Include sample plugin templates
* Add error handling and logging setup
* Provide Docker or GitHub Actions deployment guides

Feel free to adjust or enrich any section to suit your style and future updates. Let me know if you want help writing plugin examples, API docs, or deployment scripts!
— Based on current README and repository structure ([github.com][1])

[1]: https://github.com/yuurahz/yoshida "GitHub - yuurahz/yoshida: Lightweight Whatsapp Bot Using Baileys"
