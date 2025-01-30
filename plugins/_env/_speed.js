let os = require("os");
let { performance } = require("perf_hooks");

module.exports = {
  command: /^(ping|info)$/i,
  run: async (m, { Func }) => {
    const used = process.memoryUsage();
    const cpus = os.cpus().map((cpu) => {
      cpu.total = Object.keys(cpu.times).reduce(
        (last, type) => last + cpu.times[type],
        0,
      );
      return cpu;
    });
    const cpu = cpus.reduce(
      (last, cpu, _, { length }) => {
        last.total += cpu.total;
        last.speed += cpu.speed / length;
        last.times.user += cpu.times.user;
        last.times.nice += cpu.times.nice;
        last.times.sys += cpu.times.sys;
        last.times.idle += cpu.times.idle;
        last.times.irq += cpu.times.irq;
        return last;
      },
      {
        speed: 0,
        total: 0,
        times: {
          user: 0,
          nice: 0,
          sys: 0,
          idle: 0,
          irq: 0,
        },
      },
    );
    let old = performance.now();
    let neww = performance.now();
    let speed = neww - old;
    let cok = `Server Information\n\n`;
    cok += `${cpus.length} CPU : ${cpus[0].model} (${cpu.speed} MHZ)\n\n`;
    cok += `Uptime : ${Func.toDate(process.uptime() * 1000)}\n`;
    cok += `RAM : ${Func.formatSize(os.totalmem() - os.freemem())} / ${Func.formatSize(os.totalmem())}\n`;
    cok += `Speed : ${speed} ms\n`;
    cok += `${Object.keys(used)
      .map(
        (key, _, arr) =>
          `${key.padEnd(Math.max(...arr.map((v) => v.length)), " ")} : ${Func.formatSize(used[key])}`,
      )
      .join("\n")}`;
    m.reply(Func.texted("monospace", cok));
  },
};
