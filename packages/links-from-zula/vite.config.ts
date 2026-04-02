import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { baseconfig, createUserScriptUrls } from "../../vite.baseconfig";
import path from "path";
import pkg from "./package.json";

const fileid = pkg.name;

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, "../../dist"),
    emptyOutDir: false,
  },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        ...baseconfig,
        ...createUserScriptUrls(fileid),
        name: "Links from ZULA",
        version: pkg.version,
        description: {
          "": "Copy all ZULA distribution links at once, or send them to MusicBrainz.",
          ja: "ZULAの配信リンクを一括でコピー、またはMusicBrainzに送信する",
        },
        match: ["https://zula.link-map.jp/*", "https://music.youtube.com/*", "https://*.amazon.co.jp/*", "https://*.amazon.com/*"],
        connect: ["musicbrainz.org"],
      },
      build: {
        fileName: `${fileid}.user.js`,
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
