import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { baseconfig } from "../../vite.baseconfig";
import path from "path";
import pkg from "./package.json";

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
        name: "Import Niconico to MusicBrainz",
        version: pkg.version,
        description: {
          "": "Helps importing music metadata from Niconico into MusicBrainz.",
          ja: "ニコニコ動画からMusicBrainzへのインポートを支援する機能を追加します。",
        },
        match: ["https://www.nicovideo.jp/*"],
        connect: "musicbrainz.org",
      },
      build: {
        fileName: "Import Niconico to MusicBrainz.user.js",
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
