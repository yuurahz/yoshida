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
