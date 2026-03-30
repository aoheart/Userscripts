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
        name: "Import AWA to MusicBrainz",
        version: pkg.version,
        description: {
          "": "Helps importing music metadata from AWA into MusicBrainz.",
          ja: "AWAからMusicBrainzへのインポートを支援する機能を追加します。",
        },
        match: ["*://s.awa.fm/*"],
        connect: "musicbrainz.org",
      },
      build: {
        fileName: "Import AWA to MusicBrainz.user.js",
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
