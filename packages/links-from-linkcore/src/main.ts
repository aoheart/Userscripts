import { buildImporterWidget, buildSettingsModal, createImporterSettings, registerMenuCommand, ServiceEntry } from "@scripts/common/mb-seeder-settings";
import { cleanUrl, CollectResult, handleYtWatchResolvePage, isSearchUrl, resolveRedirect, resolveYtEntries, runWithConcurrency, StateCallback, UrlEntry } from "@scripts/common/mb-seeder-utils";

// ============================================================
// サービス定義
// ============================================================

interface ServiceDefinition {
  id: string;
  label: string;
  defaultEnabled: boolean;
  hosts: string[];
  unverified?: boolean;
  isHarmony?: boolean;
  tunecoreSlugs: string[];
  tunecoreStoreIds: string[];
  hiResTunecoreStoreIds?: string[];
  isReleasePage: (url: string) => boolean;
  linkTypes: number[];
  hiResLinkTypes?: number[];
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    id: "applemusic",
    label: "Apple Music / iTunes",
    defaultEnabled: false,
    hosts: ["music.apple.com", "itunes.apple.com"],
    isHarmony: true,
    tunecoreSlugs: ["apple_music", "itunes"],
    tunecoreStoreIds: ["2605", "105"],
    isReleasePage: (url) => /apple\.com\/[^/]+\/album\/[^/?#]+\/[^/?#]+/.test(url),
    linkTypes: [74, 980],
  },
  {
    id: "amazon_player",
    label: "Amazon Music (Prime)",
    defaultEnabled: true,
    hosts: ["www.amazon.co.jp", "www.amazon.com"],
    tunecoreSlugs: ["amazon_music_unlimited", "amazon_music", "amazon_prime_music", "amazon_music_free"],
    tunecoreStoreIds: ["3705", "3605", "3005", "4705"],
    isReleasePage: (url) => !isSearchUrl(url) && /amazon\.[^/]+\/music\/player\/albums\/[^/?#]+/.test(url),
    linkTypes: [77],
  },
  {
    id: "amazon_music",
    label: "Amazon Music",
    defaultEnabled: true,
    hosts: ["music.amazon.co.jp", "music.amazon.com"],
    tunecoreSlugs: [],
    tunecoreStoreIds: [],
    isReleasePage: (url) => !isSearchUrl(url) && /music\.amazon\.[^/]+\/albums\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "spotify",
    label: "Spotify",
    defaultEnabled: false,
    hosts: ["open.spotify.com"],
    isHarmony: true,
    tunecoreSlugs: ["spotify"],
    tunecoreStoreIds: ["305"],
    isReleasePage: (url) => /open\.spotify\.com\/(intl-[^/]+\/)?album\/[^/?#]+/.test(url),
    linkTypes: [85],
  },
  {
    id: "youtubemusic",
    label: "YouTube Music",
    defaultEnabled: true,
    hosts: ["music.youtube.com"],
    tunecoreSlugs: ["youtube_music_key"],
    tunecoreStoreIds: ["2105"],
    isReleasePage: (url) => /music\.youtube\.com\/browse\/[^/?#]+/.test(url) || /music\.youtube\.com\/playlist\?.*list=OLAK5uy_/.test(url),
    linkTypes: [85],
  },
  {
    id: "linemusic",
    label: "LINE MUSIC",
    defaultEnabled: true,
    hosts: ["music.line.me"],
    tunecoreSlugs: ["line"],
    tunecoreStoreIds: ["2501"],
    isReleasePage: (url) => /music\.line\.me\/[^/]+\/album\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "awa",
    label: "AWA",
    defaultEnabled: true,
    hosts: ["awa.fm"],
    tunecoreSlugs: ["awa"],
    tunecoreStoreIds: ["2701"],
    isReleasePage: (url) => /awa\.fm\/album\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "kkbox",
    label: "KKBOX",
    defaultEnabled: false,
    hosts: ["www.kkbox.com", "kkbox.com"],
    tunecoreSlugs: ["kkbox"],
    tunecoreStoreIds: ["1105"],
    isReleasePage: (url) => !isSearchUrl(url) && /kkbox\.com\/(?:[^/]+\/){1,2}album\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "recochoku",
    label: "レコチョク",
    defaultEnabled: true,
    hosts: ["recochoku.jp"],
    tunecoreSlugs: ["recochoku"],
    tunecoreStoreIds: ["401", "404"],
    hiResTunecoreStoreIds: ["441", "442", "443"],
    isReleasePage: (url) => /recochoku\.jp\/album\/[^/?#]+/.test(url),
    linkTypes: [74],
    hiResLinkTypes: [74],
  },
  {
    id: "mora",
    label: "mora",
    defaultEnabled: true,
    hosts: ["mora.jp"],
    tunecoreSlugs: ["mora"],
    tunecoreStoreIds: ["1701"],
    hiResTunecoreStoreIds: ["1702"],
    isReleasePage: (url) => !isSearchUrl(url) && /mora\.jp\/package\/[^/?#]+/.test(url),
    linkTypes: [74],
    hiResLinkTypes: [74],
  },
  {
    id: "ototoy",
    label: "OTOTOY",
    defaultEnabled: true,
    hosts: ["ototoy.jp"],
    tunecoreSlugs: ["ototoy"],
    tunecoreStoreIds: ["3301"],
    hiResTunecoreStoreIds: ["3302"],
    isReleasePage: (url) => !isSearchUrl(url) && (/ototoy\.jp\/#!release\/[^/?#]+/.test(url) || /ototoy\.jp\/feature\/[^/?#]+/.test(url) || /ototoy\.jp\/_\/default\/p\//.test(url)),
    linkTypes: [74],
    hiResLinkTypes: [74],
  },
  {
    id: "rakutenmusic",
    label: "Rakuten Music",
    defaultEnabled: false,
    hosts: ["music.rakuten.co.jp"],
    tunecoreSlugs: ["rakuten_music"],
    tunecoreStoreIds: ["3501"],
    isReleasePage: (url) => !isSearchUrl(url) && /music\.rakuten\.co\.jp\/[^/?#]+\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "mysound",
    label: "mysound",
    defaultEnabled: false,
    hosts: ["mysound.jp"],
    tunecoreSlugs: ["mysound"],
    tunecoreStoreIds: ["501"],
    isReleasePage: (url) => !isSearchUrl(url) && /mysound\.jp\/album\/[^/?#]+/.test(url),
    linkTypes: [74],
  },
  {
    id: "deezer",
    label: "Deezer",
    defaultEnabled: false,
    unverified: true,
    hosts: ["www.deezer.com", "deezer.com"],
    isHarmony: true,
    tunecoreSlugs: ["deezer"],
    tunecoreStoreIds: ["3805"],
    isReleasePage: (url) => !isSearchUrl(url) && /deezer\.com\/[^/]+\/album\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "tidal",
    label: "TIDAL",
    defaultEnabled: false,
    hosts: ["listen.tidal.com", "tidal.com"],
    isHarmony: true,
    tunecoreSlugs: ["tidal"],
    tunecoreStoreIds: ["6315"],
    isReleasePage: (url) => !isSearchUrl(url) && /tidal\.com\/(browse\/)?album\/[^/?#]+/.test(url),
    linkTypes: [980],
  },
  {
    id: "qobuz",
    label: "Qobuz",
    defaultEnabled: false,
    hosts: ["www.qobuz.com", "qobuz.com"],
    tunecoreSlugs: ["qobuz"],
    tunecoreStoreIds: ["6705"],
    isReleasePage: (url) => /qobuz\.com\/[^/]+\/album\/[^/?#]+\/[^/?#]+/.test(url),
    linkTypes: [],
  },
  {
    id: "qqmusic",
    label: "QQ Music",
    defaultEnabled: false,
    unverified: true,
    hosts: ["y.qq.com"],
    tunecoreSlugs: ["qq_music"],
    tunecoreStoreIds: ["5501"],
    isReleasePage: (url) => !isSearchUrl(url) && /albumdetail/.test(url),
    linkTypes: [],
  },
  {
    id: "kugou",
    label: "Kugou Music",
    defaultEnabled: false,
    unverified: true,
    hosts: ["www.kugou.com"],
    tunecoreSlugs: ["kugou"],
    tunecoreStoreIds: ["5502"],
    isReleasePage: (url) => !isSearchUrl(url) && /kugou\.com\/album\//.test(url),
    linkTypes: [],
  },
  {
    id: "kuwo",
    label: "Kuwo Music",
    defaultEnabled: false,
    unverified: true,
    hosts: ["www.kuwo.cn"],
    tunecoreSlugs: ["kuwo_music"],
    tunecoreStoreIds: ["5503"],
    isReleasePage: (url) => !isSearchUrl(url) && /kuwo\.cn\/album/.test(url),
    linkTypes: [],
  },
  {
    id: "netease",
    label: "NetEase Music",
    defaultEnabled: false,
    unverified: true,
    hosts: ["music.163.com"],
    tunecoreSlugs: ["net_ease"],
    tunecoreStoreIds: ["5601"],
    isReleasePage: (url) => /music\.163\.com\/#\/?album[?&]id=/.test(url),
    linkTypes: [],
  },
  {
    id: "joox",
    label: "JOOX",
    defaultEnabled: false,
    unverified: true,
    hosts: ["www.joox.com", "joox.com"],
    tunecoreSlugs: ["joox"],
    tunecoreStoreIds: ["5701"],
    isReleasePage: (url) => !isSearchUrl(url) && /joox\.com\/[^/]+\/album\//.test(url),
    linkTypes: [],
  },
  {
    id: "flo",
    label: "FLO",
    defaultEnabled: false,
    hosts: ["www.music-flo.com", "music-flo.com"],
    tunecoreSlugs: ["flo"],
    tunecoreStoreIds: ["6401"],
    isReleasePage: (url) => !isSearchUrl(url) && /music-flo\.com\/detail\/album\/[^/?#]+/.test(url),
    linkTypes: [],
  },
  {
    id: "vibe",
    label: "VIBE",
    defaultEnabled: false,
    hosts: ["vibe.naver.com"],
    tunecoreSlugs: ["vibe"],
    tunecoreStoreIds: ["6501"],
    isReleasePage: (url) => !isSearchUrl(url) && /vibe\.naver\.com\/album\/[^/?#]+/.test(url),
    linkTypes: [],
  },
  {
    id: "melon",
    label: "Melon",
    defaultEnabled: false,
    hosts: ["www.melon.com", "melon.com"],
    tunecoreSlugs: ["melon"],
    tunecoreStoreIds: ["6801"],
    isReleasePage: (url) => !isSearchUrl(url) && /melon\.com\/album\/detail\.htm/.test(url),
    linkTypes: [],
  },
  {
    id: "genie",
    label: "genie",
    defaultEnabled: false,
    hosts: ["www.genie.co.kr", "genie.co.kr"],
    tunecoreSlugs: ["genie"],
    tunecoreStoreIds: ["7401"],
    isReleasePage: (url) => !isSearchUrl(url) && /genie\.co\.kr\/detail\/albumInfo/.test(url),
    linkTypes: [],
  },
  {
    id: "ausmartpass",
    label: "auミュージックパス",
    defaultEnabled: false,
    hosts: ["au.utapass.auone.jp", "musicstore.auone.jp"],
    tunecoreSlugs: ["utapass", "recochoku403"],
    tunecoreStoreIds: ["2301", "403"],
    isReleasePage: (url) => !isSearchUrl(url) && /auone\.jp\/.*\/album\/[^/?#]+/.test(url),
    linkTypes: [74],
  },
  {
    id: "musicjp",
    label: "music.jp STORE",
    defaultEnabled: false,
    hosts: ["music-book.jp"],
    tunecoreSlugs: ["musicjp_store"],
    tunecoreStoreIds: ["1801"],
    hiResTunecoreStoreIds: ["1802"],
    isReleasePage: (url) => !isSearchUrl(url) && /music-book\.jp\/[^/?#]+\/[^/?#]+/.test(url),
    linkTypes: [74],
    hiResLinkTypes: [74],
  },
  {
    id: "oricon",
    label: "オリミュウストア",
    defaultEnabled: false,
    hosts: ["music.orimyu.com"],
    tunecoreSlugs: ["oricon"],
    tunecoreStoreIds: ["801"],
    isReleasePage: (url) => !isSearchUrl(url) && /music\.orimyu\.com\/php\/cd\//.test(url),
    linkTypes: [74],
  },
  {
    id: "usen",
    label: "SMART USEN",
    defaultEnabled: false,
    unverified: true,
    hosts: ["smart.usen.com"],
    tunecoreSlugs: ["usen"],
    tunecoreStoreIds: ["3101"],
    isReleasePage: (url) => {
      const u = new URL(url);
      return !isSearchUrl(url) && u.pathname !== "/" && u.pathname !== "";
    },
    linkTypes: [],
  },
  {
    id: "dwango",
    label: "dwango.jp",
    defaultEnabled: false,
    hosts: ["pc.dwango.jp"],
    tunecoreSlugs: ["dwango", "kpop_life", "billboard"],
    tunecoreStoreIds: ["2401", "2403", "2404"],
    isReleasePage: (url) => !isSearchUrl(url) && /\/portals\/album\//.test(url),
    linkTypes: [74],
  },
  {
    id: "animelomix",
    label: "animelo mix",
    defaultEnabled: false,
    hosts: ["pc.animelo.jp"],
    tunecoreSlugs: ["animelo_mix"],
    tunecoreStoreIds: ["2402"],
    isReleasePage: (url) => !isSearchUrl(url) && /\/portals\/album\//.test(url),
    linkTypes: [],
  },
  {
    id: "reggaezion",
    label: "レゲエザイオン",
    defaultEnabled: false,
    hosts: ["sd.reggaezion.jp", "sd.club-zion.jp", "sd.deluxe-sound.jp"],
    tunecoreSlugs: ["reggaezion", "clubzion", "deluxe"],
    tunecoreStoreIds: ["1302", "1301", "1304"],
    isReleasePage: (url) => !isSearchUrl(url) && /\/(album|titles)\/[^/?#]+/.test(url),
    linkTypes: [74],
  },
  {
    id: "dmusic",
    label: "dミュージック",
    defaultEnabled: false,
    hosts: ["dmusic.docomo.ne.jp"],
    tunecoreSlugs: ["recochoku402"],
    tunecoreStoreIds: ["402"],
    isReleasePage: (url) => /dmusic\.docomo\.ne\.jp\/album\/[^/?#]+/.test(url),
    linkTypes: [74],
  },
  {
    id: "playnetwork",
    label: "PlayNetwork",
    defaultEnabled: false,
    hosts: ["www.playnetwork.com", "playnetwork.com"],
    tunecoreSlugs: [],
    tunecoreStoreIds: [],
    isReleasePage: () => false,
    linkTypes: [],
  },
];

// SERVICE_DEFINITIONS から実行時にマップを生成
const TUNECORE_SLUG_MAP: Record<string, string> = {};
const TUNECORE_STORE_ID_MAP: Record<string, string> = {};
const HIRES_STORE_IDS = new Set<string>();
for (const svc of SERVICE_DEFINITIONS) {
  for (const slug of svc.tunecoreSlugs) TUNECORE_SLUG_MAP[slug] = svc.id;
  for (const storeId of svc.tunecoreStoreIds) TUNECORE_STORE_ID_MAP[storeId] = svc.id;
  for (const storeId of svc.hiResTunecoreStoreIds ?? []) {
    TUNECORE_STORE_ID_MAP[storeId] = svc.id;
    HIRES_STORE_IDS.add(storeId);
  }
}

// ============================================================
// 設定管理
// ============================================================

const settings = createImporterSettings("lc_mb_service_settings", () => SERVICE_DEFINITIONS.filter((s) => s.defaultEnabled).map((s) => s.id));

// ============================================================
// URL フィルタリング
// ============================================================

function findService(url: string): ServiceDefinition | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const hostname = u.hostname;
  return SERVICE_DEFINITIONS.find((s) => s.hosts.some((h) => hostname === h || hostname.endsWith("." + h))) ?? null;
}

function isReleaseUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.pathname === "/" || u.pathname === "") return false;
  if (isSearchUrl(url)) return false;
  const svc = findService(url);
  if (svc) return svc.isReleasePage(url);
  return /\/(album|albums|release|releases|single|singles|ep)\//i.test(u.pathname);
}

// ============================================================
// URL 収集
// ============================================================

async function collectUrls(onProgress: StateCallback): Promise<CollectResult> {
  const enabledIds = settings.getEnabledIds();
  const includeHiRes = settings.getIncludeHiRes();

  const LINK_SELECTORS = [".release_stores li[data-store] a[href]", "ul.store_icon li[data-store] a[href]", "li[data-store] a[href]"];
  let anchors: HTMLAnchorElement[] = [];
  for (const sel of LINK_SELECTORS) {
    anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(sel));
    if (anchors.length > 0) break;
  }

  const allHrefs = anchors.map((a) => a.href).filter(Boolean);
  if (allHrefs.length === 0) return { error: "nolinks" };

  function getTuneServiceId(anchor: HTMLAnchorElement): string | null {
    const slugMatch = anchor.href.match(/tunecore\.co\.jp\/to\/([^/]+)\/\d+/);
    if (slugMatch) {
      const slugFull = slugMatch[1];
      if (TUNECORE_SLUG_MAP[slugFull]) return TUNECORE_SLUG_MAP[slugFull];
      const slugStripped = slugFull.replace(/\d+$/, "");
      if (TUNECORE_SLUG_MAP[slugStripped]) return TUNECORE_SLUG_MAP[slugStripped];
    }
    const li = anchor.closest("li[data-store]");
    const storeId = li?.getAttribute("data-store") ?? "";
    return TUNECORE_STORE_ID_MAP[storeId] ?? null;
  }

  // 直リンク（tunecore 経由でない）
  const directHrefs = allHrefs
    .filter((h) => !h.includes("tunecore.co.jp"))
    .filter((h) => {
      try {
        const u = new URL(h);
        const svc = SERVICE_DEFINITIONS.find((s) => s.hosts.some((x) => u.hostname === x || u.hostname.endsWith("." + x)));
        return svc ? enabledIds.includes(svc.id) : true;
      } catch {
        return false;
      }
    });

  // tunecore リンク → 有効サービスのみ・通常版と Hi-Res を別枠で dedup
  const tuneAnchors = anchors.filter((a) => a.href.includes("tunecore.co.jp"));
  const seenNormal = new Set<string>();
  const seenHiRes = new Set<string>();

  type TuneEntry = { href: string; svcId: string; isHiRes: boolean };
  const dedupedTuneEntries: TuneEntry[] = [];

  for (const anchor of tuneAnchors) {
    const svcId = getTuneServiceId(anchor);
    if (svcId === null || !enabledIds.includes(svcId)) continue;
    const storeId = anchor.closest("li[data-store]")?.getAttribute("data-store") ?? "";
    const isHiRes = HIRES_STORE_IDS.has(storeId);
    if (isHiRes) {
      if (!includeHiRes) continue;
      if (seenHiRes.has(svcId)) continue;
      seenHiRes.add(svcId);
    } else {
      if (seenNormal.has(svcId)) continue;
      seenNormal.add(svcId);
    }
    dedupedTuneEntries.push({ href: anchor.href, svcId, isHiRes });
  }

  // tunecore リダイレクト解決
  type ResolvedEntry = { url: string; svcId: string; isHiRes: boolean };
  let resolvedFromTune: ResolvedEntry[] = [];
  if (dedupedTuneEntries.length > 0) {
    let done = 0;
    onProgress(`⏳ 0/${dedupedTuneEntries.length}件 解決中`, true);
    const tasks = dedupedTuneEntries.map(({ href, svcId, isHiRes }) => async () => {
      const url = await resolveRedirect(href);
      onProgress(`⏳ ${++done}/${dedupedTuneEntries.length}件 解決中`, true);
      return url !== null ? { url, svcId, isHiRes } : null;
    });
    resolvedFromTune = (await runWithConcurrency(tasks)).filter((e): e is ResolvedEntry => e !== null);
  }

  const directResolved: ResolvedEntry[] = directHrefs.map((url) => ({
    url,
    svcId: findService(url)?.id ?? "",
    isHiRes: false,
  }));

  const allResolved = [...directResolved, ...resolvedFromTune];

  // cleanUrl 後の URL → linkTypes マップ（YT 解決で URL が変化する前に構築）
  const linkTypesMap = new Map<string, number[]>(
    allResolved.map(({ url, svcId, isHiRes }) => {
      const svc = SERVICE_DEFINITIONS.find((s) => s.id === svcId) ?? findService(url);
      const lt = (isHiRes ? svc?.hiResLinkTypes : undefined) ?? svc?.linkTypes ?? [];
      return [cleanUrl(url), lt];
    }),
  );

  // YT watch → playlist 解決
  const rawEntries: UrlEntry[] = allResolved.map(({ url, svcId, isHiRes }) => {
    const svc = SERVICE_DEFINITIONS.find((s) => s.id === svcId) ?? findService(url);
    return {
      url,
      linkTypes: (isHiRes ? svc?.hiResLinkTypes : undefined) ?? svc?.linkTypes ?? [],
    };
  });
  const ytResolved = await resolveYtEntries(rawEntries, onProgress);

  const filtered = [
    ...new Map(
      ytResolved
        .map((e) => ({ ...e, url: cleanUrl(e.url) }))
        .filter((e) => {
          const svcId = allResolved.find((r) => cleanUrl(r.url) === e.url)?.svcId ?? findService(e.url)?.id ?? "";
          return isReleaseUrl(e.url) && enabledIds.includes(svcId);
        })
        .map((e) => [e.url, { ...e, linkTypes: linkTypesMap.get(e.url) ?? e.linkTypes }]),
    ).values(),
  ];

  if (filtered.length === 0) return { error: "nourl" };
  return { entries: filtered };
}

// ============================================================
// 設定モーダル
// ============================================================

function openSettingsModal(clearCache: () => void): void {
  const enabledIds = settings.getEnabledIds();

  document.body.appendChild(
    buildSettingsModal({
      services: SERVICE_DEFINITIONS.map(
        (s): ServiceEntry => ({
          id: s.id,
          label: s.label,
          isHarmony: s.isHarmony,
          unverified: s.unverified,
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
    }),
  );
}

// ============================================================
// 初期化
// ============================================================

function injectUI(): void {
  const CONTAINER_SELECTORS = [".release_stores", ".music-detail", ".release-header", ".release-info", "#release", "main", "body"];
  let container: Element | null = null;
  for (const sel of CONTAINER_SELECTORS) {
    container = document.querySelector(sel);
    if (container) break;
  }
  if (!container) return;

  let clearCache = () => {};

  ({ clearCache } = buildImporterWidget({
    collectUrls,
    openSettings: () => openSettingsModal(clearCache),
    showSettingsBtn: settings.getShowSettingsBtn(),
    showCopyBtn: settings.getShowCopyBtn(),
    mount: (wrapper) => container!.insertBefore(wrapper, container!.firstChild),
  }));
}

if (location.hostname === "music.youtube.com") {
  // YouTube Music ページ上では SPA レンダリング後の browseId を書き戻す
  handleYtWatchResolvePage();
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
  registerMenuCommand(() => openSettingsModal(() => {}));
}
