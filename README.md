# <div align="center">YOSHIDA-BOT</div>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white" alt="JSON">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License">
</div>

<div align="center">
  <h3>🚀 Lightweight & Powerful WhatsApp Bot</h3>
  <p><em>Built with Baileys • Powered by Yoshida-APIs • Completely Free</em></p>
</div>

---

## ✨ **Why Choose Yoshida-Bot?**

<table>
<tr>
<td>🆓 <strong>100% Free</strong></td>
<td>No hidden costs, completely open-source</td>
</tr>
<tr>
<td>🔌 <strong>Plugin-Ready</strong></td>
<td>Modular architecture for easy customization</td>
</tr>
<tr>
<td>⚡ <strong>Lightning Fast</strong></td>
<td>Built on Baileys for optimal performance</td>
</tr>
<tr>
<td>💾 <strong>Hybrid Storage</strong></td>
<td>PostgreSQL + JSON for optimal performance</td>
</tr>
<tr>
<td>🛡️ <strong>Reliable</strong></td>
<td>Stable connection with advanced error handling</td>
</tr>
<tr>
<td>🎯 <strong>Easy Deploy</strong></td>
<td>Multiple deployment options available</td>
</tr>
</table>

---

## 🏗️ **Architecture Overview**

```
📦 yoshida-bot/
├── 📁 library/           # Core logic & helper modules
├── 📁 plugins/           # Command-based plugin modules
├── 📁 system/            # Internal system logic
├── 📁 sessions/          # WhatsApp session files (JSON)
├── 📁 database/          # Local database files (JSON)
├── 📄 index.js           # Main application entry point
├── 📄 machine.js         # State management logic
├── ⚙️ ecosystem.config.js # PM2 deployment configuration
├── 🔐 .env               # Environment variables
└── 📋 package.json       # Project dependencies
```

---

## 📋 **Requirements**

### **System Requirements**

| Component   | Version        | Required    |
| ----------- | -------------- | ----------- |
| Node.js     | 16.x or higher | ✅          |
| npm/yarn    | Latest         | ✅          |
| Git         | Latest         | ✅          |
| FFmpeg      | Latest         | ✅          |
| ImageMagick | Latest         | ✅          |
| PostgreSQL  | 12.x or higher | ⚠️ Optional |

---

### **🟢 For Heroku Users**

**Required Buildpacks** (Add in this order):

```bash
# 1. Node.js buildpack
heroku buildpacks:add heroku/nodejs

# 2. Python buildpack
heroku buildpacks:add heroku/python

# 3. FFmpeg buildpack
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git

# 4. ImageMagick buildpack
heroku buildpacks:add https://github.com/DuckyTeam/heroku-buildpack-imagemagick.git
```

**Alternative using app.json:**

```json
{
  "buildpacks": [
    { "url": "heroku/nodejs" },
    { "url": "heroku/python" },
    {
      "url": "https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git"
    },
    { "url": "https://github.com/DuckyTeam/heroku-buildpack-imagemagick.git" }
  ]
}
```

---

### **🟡 For Windows / RDP Users**

**Download and install the following software:**

| Software        | Download Link                                                | Purpose                   |
| --------------- | ------------------------------------------------------------ | ------------------------- |
| **Git**         | [Download here](https://git-scm.com/downloads)               | Version control & cloning |
| **Node.js**     | [Download here](https://nodejs.org/en/download)              | JavaScript runtime        |
| **FFmpeg**      | [Download here](https://ffmpeg.org/download.html)            | Media processing          |
| **ImageMagick** | [Download here](https://imagemagick.org/script/download.php) | Image processing          |

**Installation Steps:**

1. **Install Git**
   - Download Git from the official website
   - Run the installer with default settings
   - Verify: `git --version`

2. **Install Node.js**
   - Download LTS version from nodejs.org
   - Run the installer (includes npm)
   - Verify: `node --version` and `npm --version`

3. **Install FFmpeg**
   - Download the Windows build
   - Extract to `C:\ffmpeg\`
   - Add `C:\ffmpeg\bin` to your system PATH
   - Verify: `ffmpeg -version`

4. **Install ImageMagick**
   - Download Windows installer
   - Run with default settings
   - Verify: `magick -version`

---

### **🟠 For Linux/VPS Users**

**Ubuntu/Debian:**

```bash
# Update package list
sudo apt update

# Install required packages
sudo apt install -y git nodejs npm ffmpeg imagemagick postgresql postgresql-contrib

# Verify installations
node --version
npm --version
ffmpeg -version
convert -version
```

**CentOS/RHEL:**

```bash
# Install NodeJS
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install other packages
sudo yum install -y git ffmpeg ImageMagick postgresql postgresql-server

# Verify installations
node --version
npm --version
ffmpeg -version
convert -version
```

---

## 🚀 **Quick Start Guide**

### 1️⃣ **Installation**

```bash
# Clone the repository
git clone https://github.com/yuurahz/yoshida.git

# Navigate to project directory
cd yoshida

# Install dependencies
npm install
```

### 2️⃣ **Configuration**

Create a `.env` file in the root directory:

```env
# Time Zone Configuration
TZ=Asia/Jakarta

# Pairing Configuration
PAIRING_STATE=true
PAIRING_NUMBER= (e.g 628xxx)

#setup
DATABASE_NAME= /** local or postgres (default local) */
DATABASE_STATE=
SESSION_NAME=
SESSION_TYPE= /** local or postgres (default local) */

#postgresql config (visit here: https://console.aiven.io)[recommended]
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_USER=
POSTGRES_DATABASE=
POSTGRES_PORT=
POSTGRES_SSL=""
```

### 3️⃣ **Launch Your Bot**

Choose your preferred method:

```bash
# Development Mode
npm start

# Production Mode with PM2
npm run pm2

# Manual PM2 Setup
pm2 start ecosystem.config.js
```

---

## 🔧 **Plugin Development**

### **Creating a Basic Plugin**

```javascript
module.exports = {
  // Plugin metadata
  help: ["ping", "test"],
  tags: ["tools"],
  command: /^(ping|test)$/i,

  // Main plugin logic
  run: async (m, { conn }) => {
    try {
      const startTime = Date.now();
      await conn.reply(m.chat, "🏓 Pong!", m);
      const endTime = Date.now();

      await conn.reply(m.chat, `⚡ Response time: ${endTime - startTime}ms`, m);
    } catch (error) {
      return conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
  },

  // Plugin permissions
  group: false, // Works in groups
  admin: false, // Requires admin
  limit: false, // Uses command limit
  premium: false, // Premium only
  botAdmin: false, // Bot needs admin
  owner: false, // Owner only
};
```

### **Creating Event Handlers**

```javascript
module.exports = {
  async before(m, { conn }) {
    try {
      // Pre-processing logic
      if (m.text && m.text.includes("hello")) {
        await conn.reply(m.chat, "👋 Hello there!", m);
      }
    } catch (error) {
      console.error("Event handler error:", error);
    }
    return true;
  },
};
```

---

## 🌐 **Deployment Options**

<div align="center">

| Platform       | Difficulty | Cost        | Recommended           |
| -------------- | ---------- | ----------- | --------------------- |
| 🟢 **Heroku**  | Easy       | Free Tier   | ✅ Best for beginners |
| 🟡 **Railway** | Easy       | Free Tier   | ✅ Great alternative  |
| 🟠 **VPS/VDS** | Medium     | $5-20/month | ⭐ Most flexible      |
| 🟡 **Replit**  | Easy       | Free Tier   | ⚠️ Limited resources  |

</div>

### **Heroku Deployment**

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create your-bot-name

# Deploy
git push heroku main
```

### **PM2 Configuration**

```javascript
module.exports = {
  apps: [
    {
      name: "yoshida-bot",
      script: "./index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=2048",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
```

---

## 📊 **Storage & Database**

### **Multi-Storage Architecture**

Yoshida-Bot uses a **hybrid storage system** for optimal performance and reliability:

<table>
<tr>
<td>🗄️ <strong>PostgreSQL</strong></td>
<td>Primary database for persistent data</td>
</tr>
<tr>
<td>📁 <strong>JSON Local</strong></td>
<td>Local file storage for sessions & cache</td>
</tr>
</table>

### **Session Management**

```javascript
// Multiple session storage options
const postgreSQLConfig = {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.POSTGRES_SSL.replace(/"""/g, ""),
    },
  },

  // Local JSON for development/backup
  local: {
    type: "json",
    path: "./sessions/",
    autoSave: true,
  },
};
```

### **Database Configuration**

```javascript
// PostgreSQL connection example
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.POSTGRES_SSL.replace(/"""/g, ""),
  },
});

// Local JSON storage
const fs = require("fs");
const path = require("path");

class Local {
  constructor(basePath = "./database/") {
    this.basePath = basePath;
    this.ensureDir();
  }

  save(key, data) {
    const filePath = path.join(this.basePath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  load(key) {
    const filePath = path.join(this.basePath, `${key}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    return null;
  }
}
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. 🍴 **Fork** the repository
2. 🌟 **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. 📤 **Push** to the branch (`git push origin feature/amazing-feature`)
5. 🔄 **Open** a Pull Request

---

## 📜 **License & Terms**

<div align="center">

**MIT License** - Free for personal and commercial use

⭐ **Please star this repository if you find it useful!**

</div>

### **Usage Guidelines**

- ✅ Free to use and modify
- ✅ Commercial use allowed
- ✅ Private use allowed
- ⚠️ Must include license and copyright notice
- ❌ No warranty provided

---

## 🏆 **Credits & Acknowledgements**

<div align="center">

| Role                    | Contributor  | Links                                            |
| ----------------------- | ------------ | ------------------------------------------------ |
| 👨‍💻 **Lead Developer**   | yuurahz      | [GitHub](https://github.com/yuurahz)             |
| 📚 **Library Provider** | @yoshx/func  | [npm](https://www.npmjs.com/package/@yoshx/func) |
| 🌐 **API Provider**     | Yoshida-APIs | [Documentation](https://api.yoshida.my.id)       |

</div>

---

## 🆘 **Support & Community**

<div align="center">

[![GitHub Issues](https://img.shields.io/github/issues/yuurahz/yoshida?style=for-the-badge)](https://github.com/yuurahz/yoshida/issues)
[![GitHub Stars](https://img.shields.io/github/stars/yuurahz/yoshida?style=for-the-badge)](https://github.com/yuurahz/yoshida/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/yuurahz/yoshida?style=for-the-badge)](https://github.com/yuurahz/yoshida/network/members)

**Need help?** Open an issue or join our community discussions!

</div>

---

## 🔮 **Roadmap**

- [ ] 🎨 Web-based dashboard
- [ ] 📱 Mobile app companion
- [ ] 🔌 Plugin marketplace
- [ ] 🌍 Multi-language support
- [ ] 🤖 AI integration
- [ ] 📊 Analytics dashboard

---

<div align="center">

**Made with ❤️ by the Yoshida-Bot Team**

_Building the future of WhatsApp automation_

</div>
