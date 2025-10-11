const cp = require("child_process");
const { promisify, inspect, format } = require("util");
const exec = promisify(cp.exec).bind(cp);
const syntaxerror = require("syntax-error");

let handler = (m) => m;
handler.before = async function (m, _2) {
	let { conn, plugins, isOwner, Func, setting, store, quoted } = _2;
	if (!isOwner && !m.fromMe) return;
	let _return;
	let _syntax = "";
	let txt = "return " + m.body.slice(3);
	if (m.body.startsWith("=>")) {
		try {
			let i = 15;
			let f = {
				exports: {},
			};
			let execFunc = new (async () => {}).constructor(
				"print",
				"m",
				"handler",
				"require",
				"conn",
				"Func",
				"setting",
				"store",
				"quoted",
				"Array",
				"process",
				"plugins",
				"module",
				"exports",
				"argument",
				txt
			);
			_return = await execFunc.call(
				conn,
				(...args) => {
					if (--i < 1) return;
					console.log(...args);
					return m.reply(format(...args));
				},
				m,
				handler,
				require,
				conn,
				Func,
				setting,
				store,
				quoted,
				CustomArray,
				process,
				plugins,
				f,
				f.exports,
				[conn, _2]
			);
		} catch (e) {
			let err = await syntaxerror(txt, "Execution Function", {
				allowReturnOutsideFunction: true,
				allowAwaitOutsideFunction: true,
			});
			if (err) _syntax = "```" + err + "```\n\n";
			_return = e;
		} finally {
			m.reply(_syntax + Func.jsonFormat(_return));
		}
	} else if (m.body.startsWith(">")) {
		let txt = m.body.slice(2);
		try {
			let evaled = await eval(txt);
			if (typeof evaled !== "string") evaled = inspect(evaled);
			m.reply(evaled);
		} catch (e) {
			m.reply(Func.jsonFormat(e));
		}
	} else if (m.body.startsWith("$")) {
		let command = m.body.slice(2).trim();
		let output;
		try {
			output = await exec(command);
		} catch (e) {
			output = e;
		} finally {
			let { stdout, stderr } = output;
			if (stdout.trim()) m.reply(Func.texted("monospace", stdout));
			if (stderr.trim()) m.reply(Func.texted("monospace", stderr));
		}
	}
};
module.exports = handler;

class CustomArray extends Array {
	constructor(...args) {
		if (typeof args[0] == "number") return super(Math.min(args[0], 10000));
		else return super(...args);
	}
}
