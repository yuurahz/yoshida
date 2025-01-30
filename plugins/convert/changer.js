const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  help: [
    "audio8d",
    "distortion",
    "flanger",
    "chorus",
    "reverb",
    "bass",
    "blown",
    "deep",
    "earrape",
    "speed",
    "nightcore",
    "reverse",
    "robot",
    "slow",
    "smooth",
    "chipmunk",
    "vibra",
    "pitch",
    "highpass",
    "lowpass",
    "underwater",
  ],
  tags: ["converter"],
  command: [
    "audio8d",
    "distortion",
    "flanger",
    "chorus",
    "reverb",
    "bass",
    "blown",
    "deep",
    "earrape",
    "speed",
    "nightcore",
    "reverse",
    "robot",
    "slow",
    "smooth",
    "chipmunk",
    "vibra",
    "pitch",
    "highpass",
    "lowpass",
    "underwater",
  ],
  run: async (m, { Func, quoted, conn }) => {
    try {
      let mime = (quoted.msg || quoted).mimetype || "";
      if (!/audio/.test(mime))
        return m.reply(Func.texted("bold", "Reply audio."));
      let audio = await quoted.download();
      if (!audio) return m.reply("Can't download audio!");
      let set;
      if (/bass/.test(m.command))
        set = "-af equalizer=f=94:width_type=o:width=2:g=30";
      if (/blown/.test(m.command)) set = "-af acrusher=.1:1:64:0:log";
      if (/deep/.test(m.command)) set = "-af atempo=4/4,asetrate=44500*2/3";
      if (/earrape/.test(m.command)) set = "-af volume=12";
      if (/speed/.test(m.command))
        set = '-filter:a "atempo=1.63,asetrate=44100"';
      if (/nightcore/.test(m.command))
        set = "-filter:a atempo=1.06,asetrate=44100*1.25";
      if (/reverse/.test(m.command)) set = '-filter_complex "areverse"';
      if (/robot/.test(m.command))
        set =
          "-filter_complex \"afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75\"";
      if (/slow/.test(m.command)) set = '-filter:a "atempo=0.7,asetrate=44100"';
      if (/smooth/.test(m.command))
        set =
          "-filter:v \"minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120'\"";
      if (/chipmunk|squirrel|chipmunk/.test(m.command))
        set = '-filter:a "atempo=0.5,asetrate=65100"';
      if (/vibra/.test(m.command)) set = '-filter_complex "vibrato=f=15"';
      if (/reverb/.test(m.command)) set = '-filter:a "aecho=0.8:0.9:1000:0.3"';
      if (/chorus/.test(m.command))
        set = '-filter:a "chorus=0.7:0.9:55:0.4:0.25:2"';
      if (/flanger/.test(m.command))
        set = '-filter:a "flanger=delay=20:depth=0.2"';
      if (/distortion/.test(m.command))
        set =
          "-filter:a \"aecho=0.8:0.9:1000:0.3,firequalizer=gain_entry='entry(0,15);entry(250,0);entry(4000,15)'\"";
      if (/pitch/.test(m.command))
        set = '-filter:a "asetrate=44100*1.25,atempo=1.25"';
      if (/highpass/.test(m.command)) set = '-filter:a "highpass=f=500"';
      if (/lowpass/.test(m.command)) set = '-filter:a "lowpass=f=500"';
      if (/underwater/.test(m.command))
        set = '-af "asetrate=44100*0.5,atempo=2,lowpass=f=300"';
      if (/audio8d/.test(m.command)) set = "-af apulsator=hz=0.125";
      let ran = new Date() * 1 + ".mp3";
      let media = path.join(__dirname, "../../tmp/" + ran);
      let filename = media + ".mp3";
      await fs.promises.writeFile(media, audio);
      exec(`ffmpeg -i ${media} ${set} ${filename}`, async (err) => {
        await fs.promises.unlink(media);
        if (err) return Promise.reject(mess.wrong);
        let buff = await fs.promises.readFile(filename);
        m.reply({
          audio: buff,
          mimetype: "audio/mpeg",
          ptt: /vn/.test(m.text),
        });
        await fs.promises.unlink(filename);
      });
    } catch (e) {
      return m.reply(Func.jsonFormat(e));
    }
  },
  limit: 1,
};
