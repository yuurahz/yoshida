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
  console.error("GEMINI_API_KEY tidak ditemukan di environment variables, fitur ai interactive tidak akan berfungsi.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cleanExpiredSessions = (db) => {
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

const getChatSession = (db, sender, geminiModel) => {
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
          const tikTokData = await tiktok(arguments.url);
          if (!tikTokData || !tikTokData.data) {
            await m.reply(
              "Gagal mengambil data TikTok. Periksa URL dan coba lagi.",
            );
          }

          const { data } = tikTokData;

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

          const pinterestResults = await pinterest(arguments.query);

          if (!pinterestResults || Object.values(pinterestResults).length < 1) {
            await m.reply("Maaf, gambar yang kamu cari tidak ditemukan.");
          }

          const respPin = Func.random(pinterestResults);
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
  before: async (m, { Func, quoted: q, conn }) => {
    try {
      const isRelevantMessage =
        (db.users[m.sender].activity?.geminiChat &&
          Object.keys(db.users[m.sender].activity?.geminiChat).length > 0 &&
          m.isQuoted &&
          m.quoted.fromMe) ||
        (Array.isArray(m.mentions) && m.mentions.includes(conn.user.jid));

      if (!isRelevantMessage) {
        return true;
      }

      cleanExpiredSessions(db);

      let mime = (q && (q.msg || q).mimetype) || "";
      const geminiModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: logic
          .replace("+sender", m.name || "Pengguna")
          .replace("+role", db.users[m.sender]?.relationship || "asisten")
          .replace("+roles", db.users[m.sender]?.relationship || "asisten"),
        tools: [{ functionDeclarations: commands }],
      });

      let chatSession = getChatSession(db, m.sender, geminiModel);

      if (db.users[m.sender]?.activity) {
        db.users[m.sender].activity.geminiChatExpiry =
          Date.now() + 60 * 60 * 1000;
      }

      let response;

      if (!mime) {
        const result = await chatSession.sendMessage(m.body);
        const contentParts = result.response?.candidates?.[0]?.content?.parts;
        if (
          contentParts &&
          contentParts.length > 0 &&
          contentParts[1]?.functionCall
        ) {
          const functionCall = contentParts[1]?.functionCall;
          console.log("API Response Tool Calls:", functionCall);
          response = await executeFunctionCall(
            functionCall?.name,
            functionCall?.args,
            chatSession,
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
            m.body,
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
              m.body || "Tolong jelaskan tentang gambar ini",
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
            if (!upload || typeof upload.tmpfiles !== "function") {
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
                  m.body || "Tolong jelaskan tentang gambar ini",
                ];
                const result = await chatSession.sendMessage(parts);
                response = result.response.text();
              } finally {
                if (fs.existsSync(filepath)) {
                  fs.unlinkSync(filepath);
                }
              }
            } else {
              const link = await upload.tmpfiles(media);
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
                m.body || "Tolong jelaskan tentang gambar ini",
              ];
              const result = await chatSession.sendMessage(parts);
              response = result.response.text();
            }
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
            m.body,
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
            m.body,
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

      if (response && response.length >= 4000) {
        response =
          response.substring(0, 4000) +
          "\n\n[Respons terlalu panjang dan mungkin terpotong. Silakan lanjutkan pertanyaan Anda untuk mendapatkan informasi lebih lanjut.]";
      }

      if (response) {
        await m
          .reply(response)
          .then(() => (db.users[m.sender].interactive += 1));
      } else {
        await m.reply("Maaf, saya tidak dapat memberikan respons saat ini.");
      }

      return true;
    } catch (error) {
      console.error("Error in gemini command:", error);
      return m.reply(`Terjadi kesalahan: ${error.message}`);
    }
  },
  limit: 1,
};

const tiktok = async (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      const encodedParams = new URLSearchParams();
      encodedParams.set("url", query);
      encodedParams.set("hd", "1");
      const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "current_language=en",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        },
        data: encodedParams,
      });
      const videos = response.data;
      resolve(videos);
    } catch (e) {
      reject(e);
    }
  });
};

const xtermai = {
  url: "https://aihub.xtermai.xyz",
  key: "Bell409" /** free key, but limited */,
};

async function getCookies() {
  try {
    const response = await axios.get("https://www.pinterest.com/csrf_error/");
    const setCookieHeaders = response.headers["set-cookie"];
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.map((cookieString) => {
        const cookieParts = cookieString.split(";");
        const cookieKeyValue = cookieParts[0].trim();
        return cookieKeyValue;
      });
      return cookies.join("; ");
    } else {
      console.warn("No set-cookie headers found in the response.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching cookies:", error);
    return null;
  }
}

async function pinterest(query) {
  try {
    const cookies = await getCookies();
    if (!cookies) {
      console.log("Failed to retrieve cookies. Exiting.");
      return;
    }

    const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";

    const params = {
      source_url: `/search/pins/?q=${query}`, // Use encodedQuery here
      data: JSON.stringify({
        options: {
          isPrefetch: false,
          query: query,
          scope: "pins",
          no_fetch_context_on_resource: false,
        },
        context: {},
      }),
      _: Date.now(),
    };

    const headers = {
      accept: "application/json, text/javascript, */*, q=0.01",
      "accept-encoding": "gzip, deflate",
      "accept-language": "en-US,en;q=0.9",
      cookie: cookies,
      dnt: "1",
      referer: "https://www.pinterest.com/",
      "sec-ch-ua":
        '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
      "sec-ch-ua-full-version-list":
        '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Windows"',
      "sec-ch-ua-platform-version": '"10.0.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      "x-app-version": "c056fb7",
      "x-pinterest-appstate": "active",
      "x-pinterest-pws-handler": "www/[username]/[slug].js",
      "x-pinterest-source-url": "/hargr003/cat-pictures/",
      "x-requested-with": "XMLHttpRequest",
    };

    const { data } = await axios.get(url, {
      headers: headers,
      params: params,
    });

    const container = [];
    const results = data.resource_response.data.results.filter(
      (v) => v.images?.orig,
    );
    results.forEach((result) => {
      container.push({
        upload_by: result.pinner.username,
        fullname: result.pinner.full_name,
        followers: result.pinner.follower_count,
        caption: result.grid_title,
        image: result.images.orig.url,
        source: "https://id.pinterest.com/pin/" + result.id,
      });
    });

    return container;
  } catch (error) {
    console.log(error);
    return [];
  }
}
