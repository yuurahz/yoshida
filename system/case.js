const fs = require("fs");
const Component = require("@yoshx/func").default;
const { Color } = new Component();

module.exports = async (conn, m) => {
  const isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false;

  try {
    switch (isCommand ? m.command.toLowerCase() : false) {
      case "tes": {
        m.reply("on!");
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
};

fs.watchFile(require.resolve(__filename), () => {
  fs.unwatchFile(require.resolve(__filename));
  console.log(Color.cyanBright("Update ~ 'case.js'"));
  delete require.cache[require.resolve(__filename)];
});
