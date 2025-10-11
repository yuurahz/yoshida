module.exports = {
	async before(m, { Func, groupSet }) {
		if (m.isGroup && groupSet.antilink && !m.isAdmin && m.body) {
			if (
				(m.body.match(/(chat.whatsapp.com)/gi) &&
					!m.body.includes(conn.groupInviteCode(m.chat))) ||
				m.body.match(/(wa.me)/gi)
			)
				return m
					.reply({
						delete: {
							remoteJid: m.chat,
							fromMe: false,
							id: m.key.id,
							participant: m.sender,
						},
					})
					.then(() =>
						m.reply(Func.texted("bold", "Antilink Mode Activated!"))
					);
		}
		return true;
	},
};
