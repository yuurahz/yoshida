const FormData = require("form-data");
const { fromBuffer } = require("file-type");
const axios = require("axios");
const cheerio = require("cheerio");
const { Function: Func } = new (require("@yoshx/func"))();

const createFormData = (content, fieldName, ext) => {
  const { mime } = fromBuffer(content) || {};
  const formData = new FormData();
  formData.append(
    fieldName,
    content,
    `${Func.randomBytes(5).toString("hex")}.${ext}`,
  );
  return formData;
};

module.exports = {
  telegraph: async (buffer) => {
    try {
      const { ext } = await fromBuffer(buffer);
      const form = await createFormData(buffer, "file", ext);
      const res = await fetch("https://telegra.ph/upload", {
        method: "POST",
        body: form,
      });
      const img = await res.json();
      if (img.error) return img.error;
      return `https://telegra.ph${img[0].src}`;
    } catch (e) {
      return false;
    }
  },
  pomf2: async (buffer) => {
    try {
      const { ext } = (await fromBuffer(buffer)) || {};
      const form = await createFormData(buffer, "files[]", ext);
      const res = await fetch("https://pomf2.lain.la/upload.php", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.success) return json;
      return json;
    } catch (e) {
      return false;
    }
  },
  tmpfiles: async (content) => {
    try {
      const { ext, mime } = (await fromBuffer(content)) || {};
      const formData = await createFormData(content, "file", ext);
      const response = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": Func.generateRandomUserAgent(),
        },
      });
      const result = await response.json();
      const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(result.data.url);
      return `https://tmpfiles.org/dl/${match[1]}`;
    } catch (e) {
      return false;
    }
  },
  uguu: async (content) => {
    try {
      const { ext, mime } = (await fromBuffer(content)) || {};
      const formData = createFormData(content, "files[]", ext);
      const response = await fetch("https://uguu.se/upload.php", {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": Func.generateRandomUserAgent(),
        },
      });
      const files = await response.json();
      return files.files[0].url;
    } catch (e) {
      return false;
    }
  },
  gofile: async (content) => {
    try {
      const { ext, mime } = (await fromBuffer(content)) || {};
      const formData = createFormData(content, "file", ext);
      const getServer = await (
        await fetch("https://api.gofile.io/getServer", {
          method: "GET",
        })
      ).json();
      const response = await fetch(
        `https://${getServer.data.server}.gofile.io/uploadFile`,
        {
          method: "POST",
          body: formData,
          headers: {
            "User-Agent": Func.generateRandomUserAgent(),
          },
        },
      );
      const result = await response.json();
      return `https://${getServer.data.server}.gofile.io/download/web/${result.data.fileId}/thumb_${result.data.fileName}`;
    } catch (e) {
      return false;
    }
  },
  oxo: async (content) => {
    try {
      const { ext, mime } = (await fromBuffer(content)) || {};
      const formData = createFormData(content, "file", ext);
      const response = await fetch("http://0x0.st", {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": Func.generateRandomUserAgent(),
        },
      });
      return await response.text();
    } catch (e) {
      return false;
    }
  },
  catbox: async (content) => {
    try {
      const { ext, mime } = (await fromBuffer(content)) || {};
      const formData = createFormData(content, "fileToUpload", ext);
      formData.append("reqtype", "fileupload");
      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": Func.generateRandomUserAgent(),
        },
      });
      return await response.text();
    } catch (e) {
      return false;
    }
  },
  itzpire: async (buffer) => {
    try {
      const { ext, mime } = (await fromBuffer(buffer)) || {};
      const formData = new FormData();
      formData.append("file", ext, {
        filename: mime,
      });
      const { data } = await axios.post(
        "https://itzpire.com/tools/upload",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );
      return data.fileInfo;
    } catch (e) {
      return false;
    }
  },
  skizo: async (buffer) => {
    try {
      const { ext, mime } = (await fromBuffer(buffer)) || {};
      const formData = new FormData();
      formData.append("file", buffer, {
        filename: Date.now() + "." + ext,
      });
      let response = await axios.request("https://skizoasia.xyz/api/upload", {
        method: "POST",
        data: formData.getBuffer(),
        headers: {
          ...formData.getHeaders(),
        },
      });
      return response.data.result.url;
    } catch (e) {
      return false;
    }
  },
  videy: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file, "video.mp4");
      const response = await fetch("https://videy.co/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        const result = `https://videy.co/v?id=${data.id}`;
        return result;
        console.log("Upload successful. Video ID:", data.id);
      } else {
        console.error("Upload failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  },
};
