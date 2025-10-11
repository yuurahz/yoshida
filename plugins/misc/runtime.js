module.exports = {
	command: /^(run|runtime|uptime)$/i,
	run: async (m, { Func }) => {
		m.reply(`~ Bot uptime: ${Func.toDate(process.uptime() * 1000)}`.trim());
	},
};
