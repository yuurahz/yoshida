const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
const { Readable } = require("stream");
const { Ytdl } = require("@library/ytdl");
const { pipeline } = require("stream/promises");
const { synthesize } = require("@library/elevenlabs");
const { logic, commands } = require("@system/logic");
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "GEMINI_API_KEY tidak ditemukan di environment variables, fitur ai interactive tidak akan berfungsi.",
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cleanExpiredSessions = (sender) => {
  const now = Date.now();
  for (const sender in db.users) {
    if (
      db.users[sender]?.activity?.geminiChatExpiry &&
      db.users[sender].activity.geminiChatExpiry < now
    ) {
      db.users[sender].activity.geminiChat = null;
      db.users[sender].activity.geminiChatExpiry = null;
    }
  }
};

const saveTempFile = async (buffer, mimeType, fileType = "audio") => {
  const tempDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const extensionMap = {
    audio: {
      "audio/wav": "wav",
      "audio/mp3": "mp3",
      "audio/aiff": "aiff",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
    },
    document: {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "text/plain": "txt",
      "text/csv": "csv",
      "application/rtf": "rtf",
    },
    image: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
    video: {
      "video/mp4": "mp4",
      "video/mpeg": "mpeg",
      "video/quicktime": "mov",
    },
  };

  const extension =
    extensionMap[fileType]?.[mimeType] ||
    (fileType === "audio"
      ? "mp3"
      : fileType === "document"
        ? "pdf"
        : fileType === "video"
          ? "mp4"
          : "jpg");
  const filename = `${fileType}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
  const filepath = path.join(tempDir, filename);

  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);

  try {
    await pipeline(readable, fs.createWriteStream(filepath));
    return { filepath, filename };
  } catch (error) {
    console.error("Error saving temp file:", error);
    throw new Error(`Failed to save temporary file: ${error.message}`);
  }
};

const processMediaContent = async (
  filepath,
  mimeType,
  text,
  chatSession,
  geminiModel,
) => {
  try {
    const fileContent = fs.readFileSync(filepath);
    const fileBase64 = Buffer.from(fileContent).toString("base64");

    const mediaPart = {
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    };

    const defaultPrompt = mimeType.startsWith("audio/")
      ? "Tolong jelaskan tentang audio ini"
      : mimeType.startsWith("image/")
        ? "Tolong jelaskan tentang gambar ini"
        : mimeType.startsWith("video/")
          ? "Tolong jelaskan tentang video ini"
          : "Tolong analisis dokumen ini";

    const parts = [mediaPart, text || defaultPrompt];
    const result = await (chatSession
      ? chatSession.sendMessage(parts)
      : geminiModel.generateContent(parts));

    return result.response.text();
  } catch (error) {
    console.error(`Error processing ${mimeType} content:`, error);
    throw new Error(`Gagal memproses konten media: ${error.message}`);
  }
};

const getChatSession = (sender, geminiModel) => {
  if (!db.users[sender]) {
    db.users[sender] = {};
  }

  if (!db.users[sender].activity) {
    db.users[sender].activity = {};
  }

  if (!db.users[sender].activity.geminiChat) {
    db.users[sender].activity.geminiChat = geminiModel.startChat({
      history: [],
    });

    db.users[sender].activity.geminiChatExpiry = Date.now() + 60 * 60 * 1000;
  }

  return db.users[sender].activity.geminiChat;
};

const executeFunctionCall = async (
  functionName,
  arguments,
  chatSession,
  API,
  Func,
  conn,
  m,
) => {
  try {
    switch (functionName) {
      case "generate_voice_message":
        conn.sendPresenceUpdate("recording", m.chat);
        try {
          await synthesize({
            model_id: "m2",
            output_format: "mp3_44100_128",
            voice_id: "iWydkXKoiVtvdn4vLKp9",
            text: arguments?.message?.replace(/[\(\[].*?[\)\]]/g, ""),
          }).then((res) => {
            m.reply({
              audio: Buffer.from(res),
              mimetype: "audio/mpeg",
              ptt: true,
            });
          });
        } catch (e) {
          console.error(e);
          await m.reply("Suara tidak tersedia saat ini.");
        }
        break;

      case "generate_image":
        try {
          await m.reply({
            image: {
              url: `${xtermai.url}/api/text2img/dalle3?prompt=${arguments.prompt}&key=${xtermai.key}&prompt=detailed`,
            },
          });
        } catch (e) {
          console.error("Error in generate_image:", e);
          await m.reply("Gagal membuat gambar");
        }
        break;

      case "search_youtube_audio":
        try {
          const search = await yts(arguments.query);
          if (!search || !search.all || search.all.length === 0) {
            await m.reply("Lagu yang kamu cari tidak ditemukan.");
          }

          const hasil = search.all[0];
          const resp = await Ytdl(hasil.url, "mp3", "128");

          if (!resp.status) {
            await m.reply("Lagu yang kamu cari tidak ditemukan.");
          }

          await m.reply({
            audio: { url: resp.data.download },
            mimetype: "audio/mpeg",
            contextInfo: {
              externalAdReply: {
                showAdAttribution: true,
                title: hasil.title,
                body: hasil.author.name,
                thumbnailUrl: hasil.image,
                sourceUrl: hasil.url,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
        } catch (error) {
          console.error("Error in search_youtube_audio:", error);
          await m.reply("Terjadi kesalahan saat mencari lagu.");
        }
        break;

      case "generate_photo":
        try {
          await m.reply({
            image: {
              url: `${xtermai.url}/api/text2img/animediff?prompt=${arguments.prompt.replace("Yoshida", "Beautiful girl")}&key=${xtermai.key}&prompt=detailed`,
            },
          });
        } catch (error) {
          console.error("Error in generate_photo:", error);
          await m.reply("Maaf, Tidak dapat mengirim gambar saat ini");
        }
        break;

      case "download_tiktok":
        try {
          const tikTokData = await Func.fetchJson(
            API("yosh", "/downloader/tiktok", { url: arguments.url }),
          );
          if (!tikTokData.status || !tikTokData.result.data) {
            await m.reply(
              "Gagal mengambil data TikTok. Periksa URL dan coba lagi.",
            );
          }

          const { data } = tikTokData.result;

          if (data.images) {
            let c = 0;
            for (let i of data.images) {
              if (c == 0)
                await m.reply({
                  image: { url: i },
                });
              else await m.reply({ image: { url: i } });
              c += 1;
              await Func.delay(3000);
            }
          } else if (data.play) {
            await m.reply({
              video: { url: data.play },
            });
          } else {
            await m.reply("Format TikTok tidak didukung.");
          }
        } catch (error) {
          console.error("Error in download_tiktok:", error);
          await m.reply("Terjadi kesalahan saat mengunduh TikTok.");
        }
        break;

      case "search_pinterest":
        try {
          if (!arguments.query) {
            await m.reply("Query pencarian diperlukan");
          }

          const pinterestResults = await Func.fetchJson(
            API("yosh", "/internet/pinterest", { query: arguments.query }),
          );

          if (
            !pinterestResults.result ||
            Object.values(pinterestResults.result).length < 1
          ) {
            await m.reply("Maaf, gambar yang kamu cari tidak ditemukan.");
          }

          const respPin = Func.random(pinterestResults.result);
          await m.reply({ image: { url: respPin.image } });
        } catch (error) {
          console.error("Error in search_pinterest:", error);
          await m.reply("Terjadi kesalahan saat mencari di Pinterest.");
        }
        break;

      default:
        throw new Error(`Fungsi tidak dikenal: ${functionName}`);
    }

    const finalResponse = await chatSession.sendMessage("");
    const finalResponseText = finalResponse.response.text();
    return finalResponseText;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
  }
};

module.exports = {
  help: ["gemini"],
  tags: ["ai"],
  command: /^(gemini|ai|resetaichat)$/i,
  run: async (m, { API, Func, quoted: q, conn }) => {
    try {
      await cleanExpiredSessions(m.sender);

      if (m.command === "resetaichat") {
        if (db.users[m.sender]?.activity?.geminiChat) {
          db.users[m.sender].activity.geminiChat = null;
          db.users[m.sender].activity.geminiChatExpiry = null;
          return m.reply("Chat history kamu sukses direset.");
        } else {
          return m.reply("Kamu belum memiliki chat history.");
        }
      }

      let text =
        m.args.length >= 1
          ? m.args.join(" ")
          : m.isQuoted && m.quoted.text
            ? m.quoted.text
            : null;

      if (!text) return m.reply(Func.example(m.prefix, m.command, "halo"));

      let mime = (q.msg || q).mimetype || "";

      const geminiModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: logic
          .replace("+sender", m.name)
          .replace("+role", db.users[m.sender]?.relationship || "asisten")
          .replace("+roles", db.users[m.sender]?.relationship || "asisten"),
        tools: [{ functionDeclarations: commands }],
      });

      let chatSession = getChatSession(m.sender, geminiModel);

      db.users[m.sender].activity.geminiChatExpiry =
        Date.now() + 60 * 60 * 1000;

      let response;

      if (!mime) {
        const result = await chatSession.sendMessage(text);
        const contentParts = result.response?.candidates[0]?.content?.parts;
        if (
          contentParts &&
          contentParts?.length > 0 &&
          contentParts[1]?.functionCall
        ) {
          const functionCall = contentParts[1]?.functionCall;
          console.log("API Response Tool Calls:", functionCall);
          response = await executeFunctionCall(
            functionCall?.name,
            functionCall?.args,
            chatSession,
            API,
            Func,
            conn,
            m,
          );
        } else {
          response = result.response.text();
          console.log("Gemini Response Text:", response);
        }
      } else if (mime.startsWith("audio/")) {
        let media = await q.download();
        const { filepath } = await saveTempFile(media, mime, "audio");
        try {
          response = await processMediaContent(
            filepath,
            mime,
            text,
            chatSession,
            geminiModel,
          );
        } finally {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } else if (mime.startsWith("image/")) {
        let media = await q.download();

        if (mime === "image/webp" || !/image\/(png|jpe?g|webp)/.test(mime)) {
          const { filepath } = await saveTempFile(media, mime, "image");
          try {
            const fileContent = fs.readFileSync(filepath);
            const imageBase64 = Buffer.from(fileContent).toString("base64");

            const imagePart = {
              inlineData: {
                data: imageBase64,
                mimeType: mime,
              },
            };

            const parts = [
              imagePart,
              text || "Tolong jelaskan tentang gambar ini",
            ];
            const result = await chatSession.sendMessage(parts);
            response = result.response.text();
          } finally {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }
        } else {
          try {
            const imageBase64 = media.toString("base64");

            const imagePart = {
              inlineData: {
                data: imageBase64,
                mimeType: mime,
              },
            };

            const parts = [
              imagePart,
              text || "Tolong jelaskan tentang gambar ini",
            ];
            const result = await chatSession.sendMessage(parts);
            response = result.response.text();
          } catch (error) {
            console.error("Error processing image:", error);
            throw new Error(`Gagal memproses gambar: ${error.message}`);
          }
        }
      } else if (mime.startsWith("video/")) {
        let media = await q.download();
        const { filepath } = await saveTempFile(media, mime, "video");
        try {
          response = await processMediaContent(
            filepath,
            mime,
            text,
            chatSession,
            geminiModel,
          );
        } finally {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } else if (
        mime.startsWith("application/") ||
        mime.startsWith("text/") ||
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "text/csv",
        ].includes(mime)
      ) {
        let media = await q.download();
        const { filepath } = await saveTempFile(media, mime, "document");
        try {
          response = await processMediaContent(
            filepath,
            mime,
            text,
            chatSession,
            geminiModel,
          );
        } finally {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } else {
        return m.reply(
          "Format file tidak didukung. Gunakan text, gambar, audio, atau dokumen.",
        );
      }

      if (response.length >= 4000) {
        response =
          response.substring(0, 4000) +
          "\n\n[Respons terlalu panjang dan mungkin terpotong. Silakan lanjutkan pertanyaan Anda untuk mendapatkan informasi lebih lanjut.]";
      }

      await m.reply(response).then(() => (db.users[m.sender].interactive += 1));
    } catch (error) {
      console.error("Error in gemini command:", error);
      return m.reply(`Terjadi kesalahan`);
    }
  },
  limit: 1,
};

const termai = {
  url: "https://aihub.xtermai.xyz",
  key: "Bell409",
};
