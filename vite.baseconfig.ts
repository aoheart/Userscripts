import monkey from "vite-plugin-monkey";
import { readFileSync } from "fs";
import { resolve } from "path";

const iconDataUrl = `data:image/svg+xml;base64,${readFileSync(resolve(__dirname, "./packages/common/assets/musicbrainz-icon-detail.svg"), "base64")}`;

type MonkeyOptions = Parameters<typeof monkey>[0];
type Userscript = MonkeyOptions["userscript"];

export const baseconfig: Partial<Userscript> = {
  namespace: "https://github.com/aoheart/Userscripts",
  author: "aoheart",
  license: "MIT",
  icon: iconDataUrl,
};
