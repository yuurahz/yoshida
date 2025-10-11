module.exports = {
	apps: [
		{
			name: "telegram",
			script: "./bot.js",
			instances: 1,
			autorestart: true,
			watch: true,
			env: {
				NODE_ENV: "production",
			},
			env_development: {
				NODE_ENV: "development",
			},
		},
	],
};
