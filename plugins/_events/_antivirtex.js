module.exports = {
	async before(m, { conn, groupSet }) {
		try {
			if (
				m.isGroup &&
				!m.fromMe &&
				m.body &&
				((groupSet.antivirtex &&
					m.body.match(
						/(৭৭৭৭৭৭৭৭|๒๒๒๒๒๒๒๒|๑๑๑๑๑๑๑๑|ดุท้่เึางืผิดุท้่เึางื)/gi
					)) ||
					(groupSet.antivirtex && m.body.length > 10000))
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
						conn.groupParticipantsUpdate(
							m.chat,
							[m.sender],
							"remove"
						)
					);
		} catch (e) {
			console.log(e);
		}
		return true;
	},
};
