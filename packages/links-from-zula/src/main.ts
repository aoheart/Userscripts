import { buildImporterWidget, buildSettingsModal, createImporterSettings, registerMenuCommand, ServiceEntry, UNKNOWN_SERVICE_ID } from "@scripts/common/mb-seeder-settings";
import { cleanUrl, CollectResult, EXCLUDED_HOSTS, handleAmazonResolvePage, handleYtWatchResolvePage, isSearchUrl, resolveAmazonEntries, resolveYtEntries, StateCallback, UrlEntry } from "@scripts/common/mb-seeder-utils";

// ============================================================
// サービス定義
// ============================================================

interface ServiceDefinition {
  id: string;
  label: string;
  isHarmony?: boolean;
  isDefaultEnabled: boolean;
  /** data-link-name の部分一致パターン（複数可）。最初にマッチしたものを使用 */
  namePatterns: string[];
  linkTypes: number[];
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // ストリーミング
  { id: "applemusic", label: "Apple Music / iTunes", isHarmony: true, isDefaultEnabled: false, namePatterns: ["Apple Music", "iTunes"], linkTypes: [74, 980] },
  { id: "spotify", label: "Spotify", isHarmony: true, isDefaultEnabled: false, namePatterns: ["Spotify"], linkTypes: [85] },
  { id: "amazonmusic", label: "Amazon Music", isDefaultEnabled: true, namePatterns: ["Amazon Music Unlimited"], linkTypes: [] },
  { id: "linemusic", label: "LINE MUSIC", isDefaultEnabled: true, namePatterns: ["LINE MUSIC"], linkTypes: [980] },
  { id: "youtubemusic", label: "YouTube Music", isDefaultEnabled: true, namePatterns: ["YouTube Music"], linkTypes: [85] },
  { id: "awa", label: "AWA", isDefaultEnabled: true, namePatterns: ["AWA"], linkTypes: [980] },
  { id: "kkbox", label: "KKBOX", isDefaultEnabled: false, namePatterns: ["KKBOX"], linkTypes: [980] },
  { id: "rakuten", label: "楽天 MUSIC", isDefaultEnabled: false, namePatterns: ["楽天 MUSIC", "楽天Music"], linkTypes: [980] },
  { id: "deezer", label: "Deezer", isHarmony: true, isDefaultEnabled: false, namePatterns: ["Deezer"], linkTypes: [980] },
  { id: "melon", label: "Melon", isDefaultEnabled: false, namePatterns: ["Melon"], linkTypes: [] },
  { id: "vibe", label: "VIBE", isDefaultEnabled: false, namePatterns: ["VIBE", "Naver VIBE"], linkTypes: [] },
  { id: "flo", label: "FLO", isDefaultEnabled: false, namePatterns: ["FLO"], linkTypes: [] },
  { id: "genie", label: "genie", isDefaultEnabled: false, namePatterns: ["Genie"], linkTypes: [] },
  { id: "bugs", label: "Bugs!", isDefaultEnabled: false, namePatterns: ["Bugs!"], linkTypes: [] },
  { id: "netease", label: "NetEase Music", isDefaultEnabled: false, namePatterns: ["NetEase"], linkTypes: [] },
  { id: "tidal", label: "TIDAL", isHarmony: true, isDefaultEnabled: false, namePatterns: ["TIDAL"], linkTypes: [980] },
  { id: "qobuz", label: "Qobuz", isDefaultEnabled: false, namePatterns: ["qobuz", "Qobuz"], linkTypes: [] },
  { id: "otoraku", label: "OTORAKU", isDefaultEnabled: false, namePatterns: ["OTORAKU"], linkTypes: [] },
  { id: "utapass", label: "うたパス", isDefaultEnabled: false, namePatterns: ["うたパス"], linkTypes: [] },
  // ダウンロード
  { id: "amazondl", label: "Amazonデジタルミュージックストア", isDefaultEnabled: true, namePatterns: ["Amazonデジタルミュージック"], linkTypes: [77] },
  { id: "mora", label: "mora", isDefaultEnabled: true, namePatterns: ["mora"], linkTypes: [74] },
  { id: "recochoku", label: "レコチョク", isDefaultEnabled: true, namePatterns: ["レコチョク (ダウンロード)", "レコチョクダ"], linkTypes: [74] },
  { id: "dmusic", label: "dミュージック", isDefaultEnabled: false, namePatterns: ["dミュージック"], linkTypes: [74] },
  { id: "musicstorerecochoku", label: "Music Store powered by レコチョク", isDefaultEnabled: false, namePatterns: ["Music Store powered by"], linkTypes: [74] },
  { id: "dwango", label: "ドワンゴジェイピー", isDefaultEnabled: false, namePatterns: ["ドワンゴジェイピー"], linkTypes: [74] },
  { id: "animelomix", label: "animelo mix", isDefaultEnabled: false, namePatterns: ["animelo mix"], linkTypes: [] },
  { id: "musicjp", label: "music.jp", isDefaultEnabled: false, namePatterns: ["music.jp"], linkTypes: [74] },
];

/**
 * data-link-name からサービス定義を検索する。
 * namePatterns のいずれかが linkName に部分一致すれば返す。
 */
function findServiceByLinkName(linkName: string): ServiceDefinition | undefined {
  for (const svc of SERVICE_DEFINITIONS) {
    if (svc.namePatterns.some((p) => linkName.includes(p))) return svc;
  }
  return undefined;
}

// LINE MUSIC launch URL → webapp URL 変換
const LM_LAUNCH_RE = /^https:\/\/music\.line\.me\/launch\b/;

function convertLineMusicUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const target = u.searchParams.get("target");
  const item = u.searchParams.get("item");
  if (target !== "album" || !item) return null;
  return `https://music.line.me/webapp/album/${item}`;
}

function isTopPageUrl(url: string): boolean {
  try {
    const { pathname, search } = new URL(url);
    return (pathname === "/" || pathname === "") && search === "";
  } catch {
    return false;
  }
}

function isAmazonSearchUrl(url: string): boolean {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (hostname.startsWith("www.amazon.")) {
      if (pathname === "/s") return true;
    }
    if (hostname.startsWith("music.amazon.")) {
      if (pathname.startsWith("/search")) return true;
      if (searchParams.has("filter")) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

// ============================================================
// 設定管理
// ============================================================

const settings = createImporterSettings("zula_mb_service_settings", () => [...SERVICE_DEFINITIONS.filter((s) => s.isDefaultEnabled).map((s) => s.id), UNKNOWN_SERVICE_ID]);

// ============================================================
// URL 収集
// ============================================================

async function collectUrls(onProgress: StateCallback): Promise<CollectResult> {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.streaming-store-link-btn[data-link-url][data-link-name], a.download-store-link-btn[data-link-url][data-link-name]"));
  if (anchors.length === 0) return { error: "nolinks" };

  const enabledIds = settings.getEnabledIds();
  const includeUnknown = enabledIds.includes(UNKNOWN_SERVICE_ID);
  const seenUrls = new Set<string>();
  const rawEntries: UrlEntry[] = [];

  for (const a of anchors) {
    const linkName = a.dataset.linkName ?? "";
    const rawUrl = a.dataset.linkUrl ?? "";
    if (!rawUrl) continue;

    const svc = findServiceByLinkName(linkName);
    const isKnown = svc !== undefined;

    if (isKnown && !enabledIds.includes(svc.id)) continue;
    if (!isKnown && !includeUnknown) continue;

    const href = LM_LAUNCH_RE.test(rawUrl) ? (convertLineMusicUrl(rawUrl) ?? rawUrl) : rawUrl;

    if (isSearchUrl(href)) continue;
    if (isAmazonSearchUrl(href)) continue;
    if (isTopPageUrl(href)) continue;
    try {
      if (EXCLUDED_HOSTS.has(new URL(href).hostname)) continue;
    } catch {
      /* ignore */
    }

    const url = cleanUrl(href);
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);

    const linkTypes = svc?.id === "amazonmusic" || svc?.id === "amazondl" ? [] : (svc?.linkTypes ?? []);

    rawEntries.push({ url, linkTypes });
  }

  if (rawEntries.length === 0) return { error: "nourl" };

  const amazonResolved = await resolveAmazonEntries(rawEntries, onProgress);
  const resolved = await resolveYtEntries(amazonResolved, onProgress);
  if (resolved.length === 0) return { error: "nourl" };

  return { entries: resolved };
}

// ============================================================
// 設定モーダル
// ============================================================

function openSettingsModal(clearCache: () => void): void {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.streaming-store-link-btn[data-link-name], a.download-store-link-btn[data-link-name]"));
  const linkNamesOnPage = anchors
    .filter((a) => {
      try {
        return !EXCLUDED_HOSTS.has(new URL(a.dataset.linkUrl ?? "").hostname);
      } catch {
        return true;
      }
    })
    .map((a) => a.dataset.linkName ?? "")
    .filter(Boolean);
  const unknownLabelsOnPage = linkNamesOnPage.filter((n) => !findServiceByLinkName(n));
  const enabledIds = settings.getEnabledIds();

  document.body.appendChild(
    buildSettingsModal({
      services: SERVICE_DEFINITIONS.map((s): ServiceEntry => ({ id: s.id, label: s.label, isHarmony: s.isHarmony })),
      isEnabled: (id) => enabledIds.includes(id),
      showSettingsBtn: settings.getShowSettingsBtn(),
      showCopyBtn: settings.getShowCopyBtn(),
      onSave: ({ enabledIds: ids, showSettingsBtn: showBtn, showCopyBtn: showCopy }) => {
        settings.saveAll(ids, showBtn, showCopy);
        clearCache();
      },
      unknownSection: {
        checked: enabledIds.includes(UNKNOWN_SERVICE_ID),
        labelsOnPage: [...new Set(unknownLabelsOnPage)],
      },
    }),
  );
}

// ============================================================
// 初期化
// ============================================================

function injectUI(): void {
  const mountTarget = document.querySelector<HTMLElement>(".store-link-content");
  if (!mountTarget) return;

  let clearCache = () => {};

  ({ clearCache } = buildImporterWidget({
    collectUrls,
    openSettings: () => openSettingsModal(clearCache),
    showSettingsBtn: settings.getShowSettingsBtn(),
    showCopyBtn: settings.getShowCopyBtn(),
    mount: (wrapper) => mountTarget.insertAdjacentElement("beforebegin", wrapper),
  }));
}

if (location.hostname.includes("amazon")) {
  handleAmazonResolvePage();
} else if (location.hostname === "music.youtube.com") {
  handleYtWatchResolvePage();
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
  registerMenuCommand(() => openSettingsModal(() => {}));
}
