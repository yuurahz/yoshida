module.exports = {
  apps: [
    {
      name: "yoshida",
      script: "./index.js",
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
