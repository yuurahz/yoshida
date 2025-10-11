module.exports = {
	help: ["restart"],
	tags: ["owner"],
	command: /^(restart|r)$/i,
	run: async (m, { Func }) => {
		await m.reply(Func.texted("bold", "Restarting . . .")).then(() => {
			process.send("reset");
		});
	},
	owner: true,
};
