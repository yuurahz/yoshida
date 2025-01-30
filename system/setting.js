const { Function: Func, Color } = new (require("@yoshx/func"))();
const fs = require("fs");

/* uploader */
global.upload = require("@library/uploader");

/* message */
global.mess = Object.freeze({
  blocked: Func.texted("bold", "Fitur sedang diperbaiki."),
  wait: Func.texted("bold", "Process. . ."),
  invalid: Func.texted("bold", "Invalid input."),
  wrong: Func.texted("bold", "Failed."),
  done: Func.texted("bold", "Succeed. . ."),
  eror: Func.texted("bold", "Terjadi kesalahan, coba lagi nanti."),
  premium: Func.texted("bold", "Fitur khusus user premium."),
  admin: Func.texted("bold", "Fitur khusus admin group."),
  botAdmin: Func.texted("bold", "Bot bukan admin."),
  owner: Func.texted("bold", "Fitur khusus owner."),
  group: Func.texted("bold", "Fitur khusus digunakan di grup."),
  private: Func.texted("bold", "Fitur khusus private chat."),
  register:
    "`Only For Registered User`\n\nSilahkan Mendaftar Terlebih Dahulu Agar Mendapatkan Pengalaman Lebih Menarik Dalam Berinteraksi Dengan Bot (⁠｡⁠•̀⁠ᴗ⁠-⁠)⁠✧\n\nKetik: `.register` untuk memulai pendaftaran",
  gconly:
    "Akses Ditolak!\n\n*Harap Join Group Resmi Bot Terlebih Dahulu, Atau Kamu Bisa Upgrade Premium Supaya Bisa Akses Bot Di Private Chat (⁠｡⁠•̀⁠ᴗ⁠-⁠)⁠✧*\n\nLink Group: +link\n\n> Jika Sudah Join Silahkan Gunakan Bot Kembali (ʘᴗʘ✿)",
});

fs.watchFile(require.resolve(__filename), () => {
  fs.unwatchFile(require.resolve(__filename));
  console.log(Color.cyanBright("Update ~ 'setting.js'"));
  delete require.cache[require.resolve(__filename)];
});
