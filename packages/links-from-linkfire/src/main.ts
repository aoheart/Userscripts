import { buildImporterWidget, buildSettingsModal, createImporterSettings, registerMenuCommand, ServiceEntry, UNKNOWN_SERVICE_ID } from "@scripts/common/mb-seeder-settings";
import { cleanUrl, CollectResult, EXCLUDED_HOSTS, handleAmazonResolvePage, isSearchUrl, resolveAmazonEntries, resolveYtEntries, StateCallback, UrlEntry } from "@scripts/common/mb-seeder-utils";

// ============================================================
// サービス定義
// ============================================================

interface ServiceDefinition {
  id: string;
  label: string;
  isHarmony?: boolean;
  isHiRes?: boolean;
  isDefaultEnabled: boolean;
  linkTypes: number[];
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  { id: "applemusic", label: "Apple Music / iTunes", isHarmony: true, isDefaultEnabled: false, linkTypes: [74, 980] },
  { id: "spotify", label: "Spotify", isHarmony: true, isDefaultEnabled: false, linkTypes: [85] },
  { id: "youtubemusic", label: "YouTube Music", isDefaultEnabled: true, linkTypes: [85] },
  { id: "amazonmusic", label: "Amazon Music", isDefaultEnabled: true, linkTypes: [] },
  { id: "linemusic", label: "LINE MUSIC", isDefaultEnabled: true, linkTypes: [980] },
  { id: "awa", label: "AWA", isDefaultEnabled: true, linkTypes: [980] },
  { id: "kkbox", label: "KKBOX", isDefaultEnabled: false, linkTypes: [980] },
  { id: "recochoku", label: "レコチョク", isDefaultEnabled: true, linkTypes: [74] },
  { id: "recochokuhires", label: "レコチョク Hi-Res", isHiRes: true, isDefaultEnabled: false, linkTypes: [74] },
  { id: "mora", label: "mora", isDefaultEnabled: true, linkTypes: [74] },
  { id: "moralossless", label: "mora Lossless", isHiRes: true, isDefaultEnabled: false, linkTypes: [74] },
  { id: "morahires", label: "mora Hi-Res", isHiRes: true, isDefaultEnabled: false, linkTypes: [74] },
  { id: "ototoy", label: "OTOTOY", isDefaultEnabled: true, linkTypes: [74] },
  { id: "rakuten", label: "Rakuten Music", isDefaultEnabled: false, linkTypes: [980] },
  { id: "mysound", label: "mysound", isDefaultEnabled: false, linkTypes: [74] },
  { id: "deezer", label: "Deezer", isHarmony: true, isDefaultEnabled: false, linkTypes: [980] },
  { id: "tidal", label: "TIDAL", isHarmony: true, isDefaultEnabled: false, linkTypes: [980] },
  { id: "qobuz", label: "Qobuz", isDefaultEnabled: false, linkTypes: [] },
  { id: "qqmusic", label: "QQ Music", isDefaultEnabled: false, linkTypes: [] },
  { id: "kugou", label: "Kugou Music", isDefaultEnabled: false, linkTypes: [] },
  { id: "kuwo", label: "Kuwo Music", isDefaultEnabled: false, linkTypes: [] },
  { id: "netease", label: "NetEase Music", isDefaultEnabled: false, linkTypes: [] },
  { id: "joox", label: "JOOX", isDefaultEnabled: false, linkTypes: [] },
  { id: "flo", label: "FLO", isDefaultEnabled: false, linkTypes: [] },
  { id: "vibe", label: "VIBE", isDefaultEnabled: false, linkTypes: [] },
  { id: "melon", label: "Melon", isDefaultEnabled: false, linkTypes: [] },
  { id: "genie", label: "genie", isDefaultEnabled: false, linkTypes: [] },
  { id: "animelomix", label: "animelo mix", isDefaultEnabled: false, linkTypes: [] },
  { id: "dwango", label: "dwango.jp", isDefaultEnabled: false, linkTypes: [74] },
  { id: "ausmartpass", label: "auミュージックパス", isDefaultEnabled: false, linkTypes: [74] },
  { id: "musicjp", label: "music.jp STORE", isDefaultEnabled: false, linkTypes: [74] },
  { id: "oricon", label: "オリミュウストア", isDefaultEnabled: false, linkTypes: [74] },
  { id: "usen", label: "SMART USEN", isDefaultEnabled: false, linkTypes: [] },
  { id: "reggaezion", label: "レゲエザイオン", isDefaultEnabled: false, linkTypes: [74] },
  { id: "dmusic", label: "dミュージック", isDefaultEnabled: false, linkTypes: [74] },
  { id: "playnetwork", label: "PlayNetwork", isDefaultEnabled: false, linkTypes: [] },
];

const SERVICE_MAP = new Map(SERVICE_DEFINITIONS.map((s) => [s.id, s]));

// data-label のエイリアス → 正規サービス ID へのマッピング
const LABEL_ALIASES: Record<string, string> = {
  itunes: "applemusic",
};

// Linkfire 自身のリンクを除外する data-label 値
const EXCLUDED_LABELS = new Set(["linkfire"]);

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

// ============================================================
// 設定管理
// ============================================================

const settings = createImporterSettings("lnkto_mb_service_settings", () => [...SERVICE_DEFINITIONS.filter((s) => s.isDefaultEnabled).map((s) => s.id), UNKNOWN_SERVICE_ID]);

// ============================================================
// URL 収集
// ============================================================

async function collectUrls(onProgress: StateCallback): Promise<CollectResult> {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("#music-services a[href][data-label]"));
  if (anchors.length === 0) return { error: "nolinks" };

  const enabledIds = settings.getEnabledIds();
  const includeUnknown = enabledIds.includes(UNKNOWN_SERVICE_ID);
  const includeHiRes = settings.getIncludeHiRes();
  const seenUrls = new Set<string>();
  const rawEntries: UrlEntry[] = [];

  for (const a of anchors) {
    const rawLabel = a.dataset.label ?? "";
    if (EXCLUDED_LABELS.has(rawLabel)) continue;
    const label = LABEL_ALIASES[rawLabel] ?? rawLabel;

    const svc = SERVICE_MAP.get(label);
    const isKnown = svc !== undefined;

    if (isKnown && svc.isHiRes && !includeHiRes) continue;
    if (isKnown && !svc.isHiRes && !enabledIds.includes(label)) continue;
    if (!isKnown && !includeUnknown) continue;

    // LINE MUSIC は cleanUrl より前に静的変換（cleanUrl が item パラメータを除去するため）
    const href = LM_LAUNCH_RE.test(a.href) ? (convertLineMusicUrl(a.href) ?? a.href) : a.href;

    // アルバムページが存在しないサービスを除外
    try {
      if (EXCLUDED_HOSTS.has(new URL(href).hostname)) continue;
    } catch {
      /* ignore */
    }

    // 未知サービスは検索ページを除外（既知サービスは lnk.to DOM が直リンクを保証）
    if (!isKnown && isSearchUrl(href)) continue;

    const url = cleanUrl(href);
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);

    const linkTypes = svc?.linkTypes ?? [];
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
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("#music-services a[href][data-label]"));
  const labelsOnPage = new Set(
    anchors
      .filter((a) => {
        try {
          return !EXCLUDED_HOSTS.has(new URL(a.href).hostname);
        } catch {
          return true;
        }
      })
      .map((a) => LABEL_ALIASES[a.dataset.label ?? ""] ?? a.dataset.label ?? "")
      .filter((l) => l && !EXCLUDED_LABELS.has(l)),
  );
  const unknownLabelsOnPage = [...labelsOnPage].filter((l) => !SERVICE_MAP.has(l));
  const enabledIds = settings.getEnabledIds();

  document.body.appendChild(
    buildSettingsModal({
      services: SERVICE_DEFINITIONS.filter((s) => !s.isHiRes).map(
        (s): ServiceEntry => ({
          id: s.id,
          label: s.label,
          isHarmony: s.isHarmony,
        }),
      ),
      isEnabled: (id) => enabledIds.includes(id),
      showSettingsBtn: settings.getShowSettingsBtn(),
      showCopyBtn: settings.getShowCopyBtn(),
      includeHiRes: settings.getIncludeHiRes(),
      onSave: ({ enabledIds: ids, showSettingsBtn: showBtn, showCopyBtn: showCopy, includeHiRes: hiRes }) => {
        settings.saveAll(ids, showBtn, showCopy, hiRes);
        clearCache();
      },
      unknownSection: {
        checked: enabledIds.includes(UNKNOWN_SERVICE_ID),
        labelsOnPage: unknownLabelsOnPage,
      },
    }),
  );
}

// ============================================================
// 初期化
// ============================================================

function injectUI(): void {
  const headerLink = document.querySelector<HTMLElement>(".header__link");
  if (!headerLink) return;

  // openSettings コールバックから参照できるよう let で先に宣言
  let clearCache = () => {};

  ({ clearCache } = buildImporterWidget({
    collectUrls,
    openSettings: () => openSettingsModal(clearCache),
    showSettingsBtn: settings.getShowSettingsBtn(),
    showCopyBtn: settings.getShowCopyBtn(),
    mount: (wrapper) => headerLink.insertAdjacentElement("afterend", wrapper),
  }));
}

if (location.hostname.includes("amazon")) {
  // Amazon Music ページ上では SPA 遷移後の URL を書き戻してタブを閉じる
  handleAmazonResolvePage();
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
  // スクリプトマネージャーメニュー登録
  registerMenuCommand(() => openSettingsModal(() => {}));
}
