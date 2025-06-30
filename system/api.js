/** api urls */
const APIs = {
  yosh: "https://api.yoshida.my.id",
  gratis: "https://api.apigratis.tech",
};

/** api key */
const APIKeys = {
  "": "",
};

const API = (name, path = "/", query = {}, apikeyqueryname) =>
  (name in APIs ? APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? "?" +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname
            ? {
                [apikeyqueryname]: APIKeys[name in APIs ? APIs[name] : name],
              }
            : {}),
        }),
      )
    : "");

module.exports = API;
