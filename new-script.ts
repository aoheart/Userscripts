/* eslint-disable security/detect-non-literal-fs-filename */
import fs from "fs";
import path from "path";
import readline from "readline";

// ---------------------------
// 入力を取得する関数
// ---------------------------
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ---------------------------
// プロジェクト名サニタイズ
//  - 空白 → ハイフン
//  - 許可文字のみ
//  - 上位ディレクトリ参照不可
// ---------------------------
function sanitizeProjectName(name: string): string {
  const base = path.basename(name);
  return base
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

// ---------------------------
// メイン処理
// ---------------------------
async function main() {
  let inputName: string;

  if (process.argv[2]) {
    inputName = process.argv[2];
  } else {
    inputName = await ask("プロジェクト名を入力してください: ");
  }

  const projectName = sanitizeProjectName(inputName);

  if (!projectName) {
    console.error("❌ 無効なプロジェクト名です");
    process.exit(1);
  }

  const root = process.cwd();
  const projectDir = path.join(root, projectName);

  // プロジェクトディレクトリが既に存在していたらエラー
  if (fs.existsSync(projectDir)) {
    console.error("⚠ そのプロジェクトは既に存在します");
    process.exit(1);
  }

  // プロジェクトディレクトリ作成
  fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });

  // =========================
  // vite.config.ts
  // =========================
  const viteConfig = `import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { baseconfig } from "../../vite.baseconfig";
import path from 'path';
import pkg from "./package.json";

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, "../../dist"),
    emptyOutDir: false,
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        ...baseconfig,
        name: '${projectName}',
        version: pkg.version,
        description: {
          '': '',
          ja: '',
        },
        match: [],
        connect: [],
      },
      build: {
        fileName: '${projectName}.user.js',
        autoGrant: true,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
`;

  fs.writeFileSync(path.join(projectDir, "vite.config.ts"), viteConfig);

  // =========================
  // package.json
  // =========================
  const packageJson = {
    name: projectName,
    private: true,
    version: "1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
      lint: "oxlint src/",
      "lint:fix": "oxlint src/ --fix",
      format: "oxfmt src/",
      "format:check": "oxfmt --check src/",
    },
  };

  fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify(packageJson, null, 2));

  // =========================
  // tsconfig.json
  // =========================
  const tsconfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src", "vite.config.ts"]
}`;

  fs.writeFileSync(path.join(projectDir, "tsconfig.json"), tsconfig);

  // =========================
  // src/main.ts
  // =========================
  fs.writeFileSync(path.join(projectDir, "src/main.ts"), `console.log("${projectName} loaded");`);

  console.log("✅ 作成完了:", projectName);
  console.log(`cd ${projectName}`);
  console.log("bun install");
  console.log("bun run dev");
}

// 実行
main();
