import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { baseconfig } from "../../vite.baseconfig";
import path from "path";

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, "../../dist"),
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@scripts/common": path.resolve(__dirname, "../common"),
    },
  },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        ...baseconfig,
        name: "Links from LinkCore",
        version: "1.0",
        description: {
          "": "Copy all LinkCore distribution links at once, or send them to MusicBrainz.",
          ja: "LinkCoreの配信リンクを一括でコピー、またはMusicBrainzに送信する",
        },
        match: ["https://linkco.re/*", "https://music.youtube.com/*"],
        connect: ["musicbrainz.org"],
      },
      build: {
        fileName: "Links from LinkCore.user.js",
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
