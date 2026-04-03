import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const PACKAGES_DIR = "packages";
const COMMON = "common";

function today(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function nextVersion(current: string): string {
  const date = today();
  const parts = current.split(".");
  const currentDate = parts.slice(0, 3).join(".");
  if (currentDate !== date) return date;
  const seq = parseInt(parts[3] ?? "0", 10);
  return `${date}.${seq + 1}`;
}

function bumpPackage(name: string): void {
  const pkgPath = join(PACKAGES_DIR, name, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const oldVersion = pkg.version;
  pkg.version = nextVersion(oldVersion);
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${name}: ${oldVersion} → ${pkg.version}`);
}

function allPackages(): string[] {
  return readdirSync(PACKAGES_DIR).filter((name) => {
    if (name === COMMON) return false;
    if (!statSync(join(PACKAGES_DIR, name)).isDirectory()) return false;
    try {
      readFileSync(join(PACKAGES_DIR, name, "package.json"), "utf-8");
      return true;
    } catch {
      return false;
    }
  });
}

function changedFiles(mode: "cached" | "head"): string[] {
  const cmd = mode === "cached" ? "git diff --cached --name-only" : "git diff --name-only HEAD~1 HEAD";
  return execSync(cmd).toString().trim().split("\n").filter(Boolean);
}

function detectPackages(): string[] {
  const staged = changedFiles("cached");
  const files = staged.length > 0 ? staged : changedFiles("head");

  const commonChanged = files.some((f) => f.startsWith(`${PACKAGES_DIR}/${COMMON}/`));

  return allPackages().filter((name) => {
    const pkgChanged = files.some((f) => f.startsWith(`${PACKAGES_DIR}/${name}/`) && f !== `${PACKAGES_DIR}/${name}/package.json`);
    if (pkgChanged) return true;

    if (commonChanged) {
      const srcDir = join(PACKAGES_DIR, name, "src");
      try {
        return execSync(`grep -rl "@scripts/common" ${srcDir}`).toString().trim().length > 0;
      } catch {
        return false;
      }
    }

    return false;
  });
}

const arg = process.argv[2];

if (!arg || arg === "auto") {
  const targets = detectPackages();
  if (targets.length === 0) {
    console.log("No packages to bump.");
  } else {
    for (const name of targets) bumpPackage(name);
  }
} else if (arg === "all") {
  for (const name of allPackages()) bumpPackage(name);
} else {
  try {
    bumpPackage(arg);
  } catch {
    console.error(`Package "${arg}" not found or has no package.json`);
    process.exit(1);
  }
}
