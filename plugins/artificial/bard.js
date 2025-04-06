const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { logic, commands } = require("@system/logic");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: logic,
});

const saveTempFile = async (buffer, mimeType, fileType = "audio") => {
  const tempDir = path.join(process.cwd(), "tmp");
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
    extensionMap[fileType][mimeType] ||
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

  await pipeline(readable, fs.createWriteStream(filepath));

  return { filepath, filename };
};

const processMediaContent = async (filepath, mimeType, text, chatSession) => {
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
};

const getChatSession = (db, sender) => {
  if (!db.users[sender]) {
    db.users[sender] = {};
  }

  if (!db.users[sender].activity) {
    db.users[sender].activity = {};
  }

  if (!db.users[sender].activity.geminiChat) {
    db.users[sender].activity.geminiChat = null;
  }

  if (!db.users[sender].activity.geminiChat) {
    db.users[sender].activity.geminiChat = geminiModel.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 1000 },
    });

    db.users[sender].activity.geminiChatExpiry = Date.now() + 60 * 60 * 1000;
  }

  return db.users[sender].activity.geminiChat;
};

const cleanExpiredSessions = (db) => {
  const now = Date.now();
  for (const sender in db.users) {
    if (
      db.users[sender].activity &&
      db.users[sender].activity.geminiChatExpiry &&
      db.users[sender].activity.geminiChatExpiry < now
    ) {
      db.users[sender].activity.geminiChat = null;
      db.users[sender].activity.geminiChatExpiry = null;
    }
  }
};

module.exports = {
  help: ["gemini"],
  tags: ["ai"],
  command: /^(gemini|ai|resetaichat)$/i,
  run: async (m, { Func, quoted: q }) => {
    cleanExpiredSessions(db);

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
    if (!text)
      return m.reply(Func.example(m.prefix, m.command, "selamat pagi"));
    let mime = (q.msg || q).mimetype || "";
    try {
      let chatSession = getChatSession(db, m.sender);

      db.users[m.sender].activity.geminiChatExpiry =
        Date.now() + 60 * 60 * 1000;

      let response;
      if (!mime) {
        const result = await chatSession.sendMessage(text);
        console.log(result);
        response = result.response.text();
      } else if (mime.startsWith("audio/")) {
        let media = await q.download();
        const { filepath } = await saveTempFile(media, mime, "audio");
        try {
          response = await processMediaContent(
            filepath,
            mime,
            text,
            chatSession,
          );
        } finally {
          fs.unlinkSync(filepath);
        }
      } else if (mime.startsWith("image/")) {
        let media = await q.download();

        const processImage = async (imageMedia) => {
          let link, filepath;
          if (mime === "image/webp" || !/image\/(png|jpe?g|webp)/.test(mime)) {
            const savedFile = await saveTempFile(imageMedia, mime, "image");
            filepath = savedFile.filepath;
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
            console.log(result);
            response = result.response.text();
            fs.unlinkSync(filepath);
          } else {
            link = await upload.tmpfiles(imageMedia);
            const imageResp = await fetch(link).then((r) => r.arrayBuffer());
            const imageBase64 = Buffer.from(imageResp).toString("base64");

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
            console.log(result);
            response = result.response.text();
          }
        };

        await processImage(media);
      } else if (mime.startsWith("video/")) {
        let media = await q.download();
        const { filepath } = await saveTempFile(media, mime, "video");
        try {
          response = await processMediaContent(
            filepath,
            mime,
            text,
            chatSession,
          );
        } finally {
          fs.unlinkSync(filepath);
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
          );
        } finally {
          fs.unlinkSync(filepath);
        }
      } else {
        return m.reply(
          "Format file tidak didukung. Gunakan text, gambar, audio, atau dokumen.",
        );
      }

      if (!response) throw new Error("Response tidak valid dari API");

      await m.reply(response);
    } catch (e) {
      console.error(e);
      return m.reply(
        `Terjadi kesalahan saat memproses permintaan: ${e.message}`,
      );
    }
  },
  limit: 1,
};
