import monkey from "vite-plugin-monkey";
import { readFileSync } from "fs";
import { resolve } from "path";

const iconDataUrl = `data:image/svg+xml;base64,${readFileSync(resolve(__dirname, "./packages/common/assets/musicbrainz-icon-detail.svg"), "base64")}`;

type MonkeyOptions = Parameters<typeof monkey>[0];
type Userscript = MonkeyOptions["userscript"];

export const baseconfig: Partial<Userscript> = {
  namespace: "https://github.com/aoheart/Userscripts",
  supportURL: "https://github.com/aoheart/Userscripts/issues",
  author: "aoheart",
  license: "MIT",
  icon: iconDataUrl,
};

const REPO = "aoheart/Userscripts";
const BRANCH = "dist";

export function createUserScriptUrls(scriptName: string) {
  const base = `https://raw.githubusercontent.com/${REPO}/refs/heads/${BRANCH}/${scriptName}.user.js`;

  return {
    updateURL: base,
    downloadURL: base,
  };
}
