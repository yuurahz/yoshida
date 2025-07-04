const LABSURL = "https://api.elevenlabs.io";
const LABSKEY = process.env.ELEVENLABS_API_KEY,
  DEFAULT_MODEL = "eleven_multilingual_v2",
  DEFAULT_URL = "https://api.elevenlabs.io";

let apiURL = LABSURL ?? DEFAULT_URL,
  apiKey = LABSKEY;

function init(url = apiURL, key = apiKey) {
  return (
    (apiURL = url),
    (apiKey = key),
    {
      apiURL: apiURL,
      apiKey: apiKey,
    }
  );
}

const FORMATS = [
  "mp3_44100_64",
  "mp3_44100_96",
  "mp3_44100_128",
  "mp3_44100_192",
  "pcm_16000",
  "pcm_22050",
  "pcm_24000",
  "pcm_44100",
];

async function apiCall(method, relativeURL, _headers, body) {
  try {
    const options = {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        ..._headers,
      },
      body: body
        ? "string" == typeof body
          ? body
          : JSON.stringify(body)
        : null,
    };
    return await fetch(apiURL + relativeURL, options);
  } catch (e) {
    throw new Error("apiCall: " + e.message);
  }
}

async function getUser() {
  try {
    const response = await apiCall("GET", "/v1/user", []);
    return await response.json();
  } catch (e) {
    throw new Error("getUser: " + e.message);
  }
  return null;
}

async function getUserInfo() {
  try {
    const response = await apiCall("GET", "/v1/user/subscription");
    return await response.json();
  } catch (e) {
    throw (console.log("getUserInfo: " + e.message), e);
  }
}

async function isValidVoice(voiceId) {
  try {
    const response = await apiCall("GET", `/v1/voices/${voiceId}`);
    return (await response.json()).voice_id === voiceId;
  } catch (e) {
    return console.log("isValidVoice: " + e.message), !1;
  }
}

async function listVoices() {
  try {
    const response = await apiCall("GET", "/v1/voices", []);
    return await response.json();
  } catch (e) {
    console.log("listVoices: " + e.message);
  }
  return null;
}

async function synthesize(ttsOptions) {
  try {
    const user = await getUser(),
      tierLevel = user?.subscription?.tier || "free",
      isMP3 = ttsOptions.output_format.startsWith("mp3_");
    "free" === tierLevel &&
      "mp3_44100_192" === ttsOptions.output_format &&
      (console.log("Free tier is limited to mp3_44100_128 format."),
      (ttsOptions.output_format = "mp3_44100_128"));
    const headers = {
        Accept: isMP3 ? "audio/mpeg" : "audio/wav",
      },
      output_format = ttsOptions.output_format,
      model_id =
        {
          e1: "eleven_monolingual_v1",
          e2: "eleven_monolingual_v2",
          m1: "eleven_multilingual_v1",
          m2: "eleven_multilingual_v2",
        }[ttsOptions.model_id] || DEFAULT_MODEL;
    console.log("Using model: " + model_id);
    const requestBody = {
      ...ttsOptions,
      model_id: model_id,
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0,
      },
    };
    delete requestBody.output_format;
    const response = await apiCall(
        "POST",
        `/v1/text-to-speech/${ttsOptions?.voice_id}/stream?output_format=${output_format}`,
        headers,
        requestBody,
      ),
      contentType = response.headers.get("content-type");
    return contentType && contentType.includes("application/json")
      ? await response.json()
      : await response.arrayBuffer();
  } catch (e) {
    return e;
  }
}

module.exports = {
  getUser,
  getUserInfo,
  isValidVoice,
  listVoices,
  synthesize,
};
