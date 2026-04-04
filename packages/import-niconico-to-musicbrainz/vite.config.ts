import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { baseconfig, createUserScriptUrls } from "../../vite.baseconfig";
import path from "path";
import pkg from "./package.json";

const projectName = pkg.name;

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
        ...createUserScriptUrls(projectName),
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
        fileName: `${projectName}.user.js`,
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
