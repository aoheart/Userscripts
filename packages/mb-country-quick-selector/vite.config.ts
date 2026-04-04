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
        ...createUserScriptUrls(fileid),
        name: "MusicBrainz Country Quick Selector",
        version: pkg.version,
        description: {
          "": "Streamlines country selection in the Release Editor with quick-access buttons.",
          ja: "リリースエディタで国選択を簡単にするボタンを追加します",
        },
        match: ["*://*.musicbrainz.org/release/add", "*://*.musicbrainz.org/release/*/edit"],
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
