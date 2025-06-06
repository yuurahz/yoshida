# 🤖 YOSHIDA-BOT

<div align="center">
  <img src="https://files.catbox.moe/g155d2.jpg" alt="Yoshida Bot" width="500"/>
  
  ![GitHub Repo views](https://komarev.com/ghpvc/?username=yuurahz&label=Repository%20Views&color=0e75b6&style=for-the-badge)
  ![GitHub stars](https://img.shields.io/github/stars/yuurahz/yoshida?style=for-the-badge&color=gold)
  ![GitHub forks](https://img.shields.io/github/forks/yuurahz/yoshida?style=for-the-badge&color=blue)
  ![GitHub issues](https://img.shields.io/github/issues/yuurahz/yoshida?style=for-the-badge&color=red)
  ![GitHub license](https://img.shields.io/github/license/yuurahz/yoshida?style=for-the-badge&color=green)
</div>

---

## ✨ Introduction

**YOSHIDA** is a powerful and versatile WhatsApp bot packed with multifunctional features, built using **[Baileys](https://github.com/Whiskeysockets/Baileys)** library for free!

### 🌟 Key Features
- 🤖 **Interactive AI Integration** - Engaging and realistic conversation experience
- 💾 **Dual Storage System** - PostgreSQL and Local storage options
- 🔧 **Highly Customizable** - Tailor the bot to your needs
- 🚀 **Fast & Reliable** - Optimized performance
- 📱 **Multi-Platform** - Works across different devices

---

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js v16+ 
- NPM or Yarn
- WhatsApp Account

### ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/yuurahz/yoshida.git

# Navigate to project directory
cd yoshida

# Install dependencies
npm install

# Start the bot
npm start
```

---

## ⚙️ Environment Configuration

Create a `.env` file in your project root and configure the following:

```bash
# 🌍 General Configuration
TZ=Asia/Jakarta                 # Your timezone
DATABASE_STATE=json          # Database type: json/mongo
DATABASE_URL=your_mongodb_url   # MongoDB URL (optional)

# 📱 WhatsApp Configuration
PAIRING_STATE=true                 # Enable pairing mode
PAIRING_NUMBER=628XXX           # Your WhatsApp number

# 🗄️ Session Configuration
SESSION_TYPE=local                 # Session type: local/postgresql (default local)
SESSION_NAME=yoshida_session    # Session identifier

# 🐘 PostgreSQL Configuration
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_USER=your_postgres_user
POSTGRES_DATABASE=your_postgres_database
POSTGRES_PORT=your_postgres_port
POSTGRES_SSL="your_ssl_certificate"       # SSL certificate for secure connection

# 🎭 Bot Behavior
REACT_STATUS=👀,❤️,🔥,💯,✨    # Status reaction emojis
```

---

## 🔧 PM2 Configuration (Production)

Create `ecosystem.config.js` for production deployment:

```javascript
module.exports = {
  apps: [{
    name: "yoshida",
    script: "./index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "2G",
    node_args: "--max-old-space-size=2048",
    env: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🛠️ Plugin Development

### 🎯 Command Plugin Structure

```javascript
module.exports = {
   help: ['ping', 'test'],           // Command help display
   tags: ['main'],                   // Plugin category
   command: /^(ping|test)$/i,        // Command regex pattern
   
   run: async (m, { conn, Func }) => {
      try {
         // 🎉 Your awesome code here
         m.reply('🏓 Pong! Bot is running smoothly!');
      } catch (error) {
         console.error(error);
         return m.reply(Func.jsonFormat(error));
      }
   },
   
   // 🔒 Permission Settings
   group: false,        // Group only command
   admin: false,        // Admin only command  
   limit: true,         // Use command limits
   premium: false,      // Premium user only
   botAdmin: false,     // Bot must be admin
   owner: false         // Owner only command
};
```

### 🎪 Event Plugin Structure

```javascript
module.exports = {
   async before(m, { conn, Func, store }) {
      try {
         // 🎭 Pre-processing logic
         if (m.text && m.text.includes('hello')) {
            m.reply('👋 Hello there!');
         }
      } catch (error) {
         console.error(error);
         return m.reply(Func.jsonFormat(error));
      }
      return true; // Continue to next handler
   }
};
```

### 🎮 Case Handler Structure

```javascript
case "example": {
   // 🎲 Simple case execution
   m.reply("✨ Example command executed!");
   break;
}

case "advanced": {
   try {
      // 🚀 Advanced logic with error handling
      const result = await someAsyncOperation();
      m.reply(`🎊 Result: ${result}`);
   } catch (error) {
      m.reply(`❌ Error: ${error.message}`);
   }
   break;
}
```

---

## 🏗️ Deployment Options

### 🌐 Recommended Hosting Platforms

| Platform | Type | Recommendation |
|----------|------|----------------|
| [![Heroku](https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com/) | Cloud Platform | ⭐⭐⭐⭐⭐ |
| [![DigitalOcean](https://img.shields.io/badge/DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://digitalocean.com/) | VPS/RDP | ⭐⭐⭐⭐⭐ |
| [![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/) | Cloud Platform | ⭐⭐⭐⭐ |
| [![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/) | Cloud Platform | ⭐⭐⭐⭐ |

### 🗄️ Database Options

| Database | Use Case | Performance |
|----------|----------|-------------|
| [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/) | Large Scale | ⭐⭐⭐⭐⭐ |
| [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://console.aiven.io) | Session Storage | ⭐⭐⭐⭐⭐ |
| ![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white) | Development | ⭐⭐⭐ |

---

## 🔨 Heroku Buildpacks

For Heroku deployment, add these buildpacks:

| Buildpack | Purpose | Link |
|-----------|---------|------|
| **FFMPEG** | Media Processing | [![Add Buildpack](https://img.shields.io/badge/Add-Buildpack-purple?style=for-the-badge)](https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest) |
| **ImageMagick** | Image Processing | [![Add Buildpack](https://img.shields.io/badge/Add-Buildpack-purple?style=for-the-badge)](https://github.com/DuckyTeam/heroku-buildpack-imagemagick) |

---

## 📜 Terms & Conditions

### ✅ Allowed
- ✨ Personal and educational use
- 🔧 Modifications and improvements
- 🌟 Contributions to the project

### ❌ Not Allowed
- 💰 Commercial sale without significant modifications
- 🏴‍☠️ Removing credits or license
- 🚫 Malicious or harmful usage
- 🤖 Creating fake or misleading copies

### 🙏 Please Remember
- ⭐ Give this repository a star if you find it helpful
- 🔗 Keep original credits intact
- 🛡️ Use trusted hosting platforms
- 📝 Report issues responsibly

---

## 🆘 Support & Community

Need help or want to contribute? Join our community!

<div align="center">
  
[![WhatsApp Group](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/HnoKcpzYsKE5y0thEM060h)
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-red?style=for-the-badge&logo=github)](https://github.com/yuurahz/yoshida/issues)
[![Discussions](https://img.shields.io/badge/GitHub-Discussions-blue?style=for-the-badge&logo=github)](https://github.com/yuurahz/yoshida/discussions)

</div>

---

## 🎉 Contributors & Credits

<div align="center">

### 👥 Amazing Contributors

| [<img src="https://github.com/rifnd.png?size=80" width="80"><br>**Nando**<br>*Inspiration*](https://github.com/rifnd) | [<img src="https://github.com/yuurahz.png?size=80" width="80"><br>**Adi**<br>*Developer*](https://github.com/yuurahz) | [<img src="https://github.com/Whiskeysockets.png?size=80" width="80"><br>**Baileys**<br>*Library Provider*](https://github.com/Whiskeysockets) | [<img src="https://github.com/ItsxZaid.png?size=80" width="80"><br>**Zaid**<br>*Postgres Session*](https://github.com/ItsxZaid) |
|:---:|:---:|:---:|:---:|

### 🌟 Special Thanks
- All contributors and users who make this project better
- The open-source community for inspiration and support
- Beta testers who help improve stability

</div>

---

<div align="center">

### 💫 Made with ❤️ by the Yoshida Team

![Wave](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer)

**Don't forget to ⭐ star this repository if you found it helpful!**

</div>