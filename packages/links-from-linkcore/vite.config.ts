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
        ...createUserScriptUrls(projectName),
        name: "Links from LinkCore",
        version: pkg.version,
        description: {
          "": "Copy all LinkCore distribution links at once, or send them to MusicBrainz.",
          ja: "LinkCoreの配信リンクを一括でコピー、またはMusicBrainzに送信する",
        },
        match: ["https://linkco.re/*", "https://music.youtube.com/*"],
        connect: ["musicbrainz.org"],
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
