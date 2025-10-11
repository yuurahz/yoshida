module.exports = {
	help: ["deleteuser"],
	tags: ["owner"],
	command: /^(del(ete)?user)$/i,
	run: async (m, { conn, Func }) => {
		m.text = no(m.text);
		if (isNaN(m.text)) {
			let number = m.text.split`@`[1];
		} else if (!isNaN(m.text)) {
			let number = m.text;
		}
		if (!text && !m.isQuoted)
			return m.reply(Func.texted("bold", `Reply/tag user`));
		if (isNaN(number))
			return m.reply(
				Func.texted("bold", `Nomor yang kamu masukkan tidak valid!`)
			);
		if (number.length > 15)
			return m.reply(
				Func.texted("bold", `Nomor yang kamu masukkan tidak valid!`)
			);
		try {
			if (m.text) {
				let user = number + "@s.whatsapp.net";
			} else if (m.quoted.sender) {
				let user = m.quoted.sender;
			} else if (m.mentions) {
				let user = number + "@s.whatsapp.net";
			}
		} catch (e) {
		} finally {
			let groupMetadata = m.isGroup
				? await store.groupMetadata[m.chat]
				: {};
			let participants = m.isGroup ? groupMetadata.participants : [];
			let users = m.isGroup
				? participants.find((u) => u.jid == user)
				: {};
			let number = user.split("@")[0];
			delete db.users[user];
			let pp = await conn
				.profilePictureUrl(number + "@s.whatsapp.net", "image")
				.catch(
					(_) => "https://telegra.ph/file/24fa902ead26340f3df2c.png"
				);
			let anu = `[ ✓ ] Berhasil menghapus *${conn.getName(number + "@s.whatsapp.net")}* dari *DATABASE*`;
			await conn.sendFile(m.chat, pp, "", anu, m, {
				mentions: [number + "@s.whatsapp.net"],
			});
		}
	},
	owner: true,
};

function no(number) {
	return number.replace(/\s/g, "").replace(/([@+-])/g, "");
}
