import { createMBForm, submitMBForm } from "./mb-formsubmit";

/* =========================================================
 *  TYPES
 * ========================================================= */

export interface ParsedMbid {
  mbid: string;
  host: string;
}

/** url: 送信するURL, linkTypes: MusicBrainz link_type ID（空配列なら link_type フィールドを省略） */
export interface UrlEntry {
  url: string;
  linkTypes: number[];
}

export type CollectResult = { entries: UrlEntry[] } | { error: "nolinks" | "nourl" };

export type StateCallback = (label: string, processing: boolean) => void;

/* =========================================================
 *  URL UTILITIES
 * ========================================================= */

// 検索/一覧ページ除外: パスに /search /searches /find /sch を含む、
// またはクエリに検索キーワード系パラメータを含む
const SEARCH_EXCLUDE = /\/search|\/searches|\/find|\/sch\b|[?&](q|query|keyword|key|keyWord|Keyword|w|search_word|kw|s|freeWord)=/i;

export const isSearchUrl = (url: string): boolean => SEARCH_EXCLUDE.test(url);

export const KEEP_PARAMS: Record<string, Set<string>> = {
  "music.apple.com": new Set(["i"]),
  "itunes.apple.com": new Set(["i"]),
  // music.youtube.com はパス依存のため cleanUrl 内で個別処理
  "music.163.com": new Set(["id"]),
  "y.qq.com": new Set(["albummid"]),
  "www.kuwo.cn": new Set(["id"]),
  "www.melon.com": new Set(["albumId"]),
  "www.genie.co.kr": new Set(["axnm"]),
  "www.music-flo.com": new Set(["id"]),
};

export function cleanUrl(rawUrl: string): string {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  if (u.protocol === "http:") u.protocol = "https:";
  if (u.hostname === "itunes.apple.com") u.hostname = "music.apple.com";

  if (u.hostname === "music.rakuten.co.jp") {
    const m = u.pathname.match(/^(\/link\/album\/[^/]+\/)/);
    if (m) u.pathname = m[1];
  }
  let allowed: Set<string>;
  if (u.hostname === "music.youtube.com") {
    if (u.pathname.startsWith("/watch")) {
      allowed = new Set(["v"]);
    } else {
      allowed = new Set(["list"]);
    }
  } else {
    allowed = KEEP_PARAMS[u.hostname] ?? new Set<string>();
  }

  const cleaned = new URLSearchParams();
  for (const [key, val] of u.searchParams) {
    if (allowed.has(key)) cleaned.append(key, val);
  }
  u.search = cleaned.toString();
  return u.toString();
}

/* =========================================================
 *  ASYNC CONCURRENCY
 * ========================================================= */

const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 1000;

export function randomDelay(): Promise<void> {
  const ms = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit = 2): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  async function worker(workerIndex: number): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      if (i > 0 || workerIndex > 0) await randomDelay();
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, (_, wi) => worker(wi)));
  return results;
}

/* =========================================================
 *  YOUTUBE MUSIC PLAYLIST RESOLVER
 * ========================================================= */

const RESOLVE_TIMEOUT_MS = 10000;

function fetchYtMusicOgUrl(playlistUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      GM.xmlHttpRequest({
        method: "GET",
        url: playlistUrl,
        timeout: RESOLVE_TIMEOUT_MS,
        onload: (res) => {
          const match = res.responseText?.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/);
          resolve(match ? match[1] : null);
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null),
      });
    } catch {
      resolve(null);
    }
  });
}

const YT_PLAYLIST_RE = /music\.youtube\.com\/playlist\?.*list=OLAK5uy_/;
const YT_WATCH_RE = /music\.youtube\.com\/watch\?/;

/**
 * /browse/MPREb_ ページの HTML から OLAK5uy_ playlist ID を抽出して playlist URL を返す。
 * 取得できない場合は browse URL 自体を返す。
 */
function fetchYtBrowsePlaylistUrl(browseId: string): Promise<string> {
  const browseUrl = `https://music.youtube.com/browse/${browseId}`;
  return new Promise((resolve) => {
    try {
      GM.xmlHttpRequest({
        method: "GET",
        url: browseUrl,
        timeout: RESOLVE_TIMEOUT_MS,
        onload: (res) => {
          const m = res.responseText?.match(/\blist=(OLAK5uy_[A-Za-z0-9_-]+)/);
          if (m) {
            resolve(`https://music.youtube.com/playlist?list=${m[1]}`);
          } else {
            resolve(browseUrl);
          }
        },
        onerror: () => resolve(browseUrl),
        ontimeout: () => resolve(browseUrl),
      });
    } catch {
      resolve(browseUrl);
    }
  });
}

/**
 * GM.openInTab で YouTube Music の /watch ページを別タブで開き、
 * SPA レンダリング後に DOM から MPREb_ browseId を取得して書き戻す。
 */
async function resolveYtWatchUrlViaTab(watchUrl: string): Promise<string | null> {
  const POLL_INTERVAL_MS = 100;
  const TIMEOUT_MS = 15000;
  const reqKey = `yt_watch_resolve_req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const resKey = `yt_watch_resolve_res_${reqKey}`;

  const browseId = await new Promise<string | null>((resolve) => {
    GM_setValue(reqKey, watchUrl);
    GM.openInTab(watchUrl, { active: true, insert: true });

    const started = Date.now();
    const timer = setInterval(() => {
      const result = GM_getValue<string | null>(resKey, null);
      if (result !== null) {
        clearInterval(timer);
        GM_deleteValue(reqKey);
        GM_deleteValue(resKey);
        resolve(result === "" ? null : result);
        return;
      }
      if (Date.now() - started > TIMEOUT_MS) {
        clearInterval(timer);
        GM_deleteValue(reqKey);
        resolve(null);
      }
    }, POLL_INTERVAL_MS);
  });

  if (!browseId) return null;
  // browseId から playlist URL を取得
  return fetchYtBrowsePlaylistUrl(browseId);
}

/**
 * YouTube Music /watch ページ上で呼び出す。
 * SPA レンダリング後の DOM から MPREb_ browseId を探してポーリングし、
 * 見つかったら browseId のみ書き戻してタブを閉じる。
 * tunecore 側で browseId を受け取り、GM.xmlHttpRequest で playlist URL を取得する。
 */
export function handleYtWatchResolvePage(): void {
  const keys = GM_listValues() as string[];
  const reqKey = keys.find((k) => k.startsWith("yt_watch_resolve_req_"));
  if (!reqKey) return;

  // /browse/MPREb_ ページで再起動しないようガード
  if (/\/browse\/MPREb_/.test(location.pathname)) return;

  const resKey = `yt_watch_resolve_res_${reqKey}`;
  const POLL_INTERVAL_MS = 100;
  const TIMEOUT_MS = 12000;
  const started = Date.now();

  const timer = setInterval(() => {
    const anchor = document.querySelector<HTMLAnchorElement>('a[href*="MPREb_"]');
    if (anchor) {
      const m = anchor.getAttribute("href")?.match(/MPREb_[A-Za-z0-9_-]+/);
      if (m) {
        clearInterval(timer);
        GM_setValue(resKey, m[0]); // browseId のみ書き戻す
        window.close();
        return;
      }
    }
    if (Date.now() - started > TIMEOUT_MS) {
      clearInterval(timer);
      GM_setValue(resKey, "");
      window.close();
    }
  }, POLL_INTERVAL_MS);
}

/**
 * entries 中の YouTube Music /watch URL をアルバム playlist URL に変換する。
 * 変換できないエントリはそのまま残す（シングルとして扱う）。
 * 内部処理のみ（resolveYtEntries 経由で呼ぶこと）。
 */
async function resolveYtWatchEntries(entries: UrlEntry[], onProgress: StateCallback): Promise<UrlEntry[]> {
  const watchEntries = entries.filter((e) => YT_WATCH_RE.test(e.url));
  if (watchEntries.length === 0) return entries;

  let done = 0;
  onProgress(`⏳ 0/${watchEntries.length}件 YT watch解決中`, true);

  // openInTab は並列だとタブが大量に開くため逐次処理
  const watchMap: Record<string, string | null> = {};
  for (const entry of watchEntries) {
    watchMap[entry.url] = await resolveYtWatchUrlViaTab(entry.url);
    onProgress(`⏳ ${++done}/${watchEntries.length}件 YT watch解決中`, true);
  }

  return entries.map((e): UrlEntry => {
    if (!YT_WATCH_RE.test(e.url)) return e;
    const resolved = watchMap[e.url] ?? null;
    return resolved !== null ? { ...e, url: resolved } : e;
  });
}

/**
 * entries 中の YouTube Music playlist URL を og:url で解決して置き換える。
 * 解決失敗したエントリは除外される。
 * 内部処理のみ（resolveYtEntries 経由で呼ぶこと）。
 */
async function resolveYtPlaylistEntries(entries: UrlEntry[], onProgress: StateCallback): Promise<UrlEntry[]> {
  const ytEntries = entries.filter((e) => YT_PLAYLIST_RE.test(e.url));
  if (ytEntries.length === 0) return entries;

  let done = 0;
  onProgress(`⏳ 0/${ytEntries.length}件 YT解決中`, true);

  const tasks = ytEntries.map((entry) => async (): Promise<[string, string | null]> => {
    const resolved = await fetchYtMusicOgUrl(entry.url);
    onProgress(`⏳ ${++done}/${ytEntries.length}件 YT解決中`, true);
    return [entry.url, resolved];
  });

  const ytMap = Object.fromEntries(await runWithConcurrency(tasks));

  return entries
    .map((e): UrlEntry | null => {
      if (!YT_PLAYLIST_RE.test(e.url)) return e;
      const resolved = ytMap[e.url] ?? null;
      return resolved !== null ? { ...e, url: resolved } : null;
    })
    .filter((e): e is UrlEntry => e !== null);
}

/**
 * entries 中の YouTube Music URL（/watch → playlist → og:url）を解決する。
 * /watch → playlist URL → og:url の順で解決する。
 */
export async function resolveYtEntries(entries: UrlEntry[], onProgress: StateCallback): Promise<UrlEntry[]> {
  const afterWatch = await resolveYtWatchEntries(entries, onProgress);
  return resolveYtPlaylistEntries(afterWatch, onProgress);
}

/**
 * entries 中の Amazon Music URL を別タブで開いて SPA 遷移後の最終 URL に解決する。
 * link_type も URL パターンから自動設定する。
 */
export async function resolveAmazonEntries(entries: UrlEntry[], onProgress: StateCallback): Promise<UrlEntry[]> {
  const amazonEntries = entries.filter((e) => e.url.includes("amazon"));
  if (amazonEntries.length === 0) return entries;

  let done = 0;
  onProgress(`⏳ 0/${amazonEntries.length}件 Amazon解決中`, true);

  const amazonMap: Record<string, UrlEntry> = {};
  for (const entry of amazonEntries) {
    const finalUrl = (await resolveAmazonUrlViaTab(entry.url)) ?? entry.url;
    const resolvedUrl = cleanUrl(finalUrl);
    amazonMap[entry.url] = { url: resolvedUrl, linkTypes: resolveAmazonLinkTypes(resolvedUrl) };
    onProgress(`⏳ ${++done}/${amazonEntries.length}件 Amazon解決中`, true);
  }

  return entries.map((e) => (e.url.includes("amazon") ? (amazonMap[e.url] ?? e) : e));
}

/* =========================================================
 *  MUSICBRAINZ SEEDING
 * ========================================================= */

const MB_HOSTS = ["musicbrainz.org", "beta.musicbrainz.org", "test.musicbrainz.org", "musicbrainz.eu"];

export function extractReleaseMbid(input: string): ParsedMbid | null {
  const trimmed = input.trim();
  const m = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) return null;
  const mbid = m[0].toLowerCase();
  let host = "musicbrainz.org";
  try {
    const u = new URL(trimmed);
    if (MB_HOSTS.includes(u.hostname)) host = u.hostname;
  } catch {
    /* MBID のみ入力 → デフォルトホスト */
  }
  return { mbid, host };
}

/**
 * UrlEntry[] を MusicBrainz の /release/add または /release/{mbid}/edit へ送信する。
 * linkTypes が複数の場合は同一 URL を複数エントリに展開する（Apple Music 等）。
 */
function buildEditNote(): string {
  const name = GM_info?.script?.name ?? "unknown script";
  const version = GM_info?.script?.version;
  const label = version ? `${name} (${version})` : name;
  return `${window.location.href}\n---\n${label}`;
}

export function seedToMusicBrainz(entries: UrlEntry[], parsed: ParsedMbid | null): void {
  const host = parsed?.host ?? "musicbrainz.org";
  const mbRoot = `https://${host}`;
  const action = parsed ? `/release/${parsed.mbid}/edit` : "/release/add";

  const params: Record<string, string> = {};
  let idx = 0;
  for (const { url, linkTypes } of entries) {
    if (linkTypes.length === 0) {
      params[`urls.${idx}.url`] = url;
      idx++;
    } else {
      for (const lt of linkTypes) {
        params[`urls.${idx}.url`] = url;
        params[`urls.${idx}.link_type`] = String(lt);
        idx++;
      }
    }
  }

  params["edit_note"] = buildEditNote();

  submitMBForm(createMBForm(action, params, { mbRoot }));
}

/* =========================================================
 *  REDIRECT RESOLUTION
 * ========================================================= */

export function resolveAmazonLinkTypes(url: string): number[] {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname.startsWith("music.amazon.")) return [980];
    if (hostname.startsWith("www.amazon.") && pathname.startsWith("/music/")) return [77];
  } catch {
    /* ignore */
  }
  return [980];
}

/**
 * アルバム単位のページが存在しないサービスのホスト。
 * 既知・未知問わず収集から除外する。
 */
export const EXCLUDED_HOSTS = new Set(["dhits.docomo.ne.jp"]);

/**
 * GM.openInTab で Amazon Music のページを別タブで開き、
 * SPA 遷移後の最終 URL を GM_setValue 経由で受け取る。
 *
 * 【仕組み】
 * 1. lnk.to 側（本関数）: ユニークなキーを GM_setValue で書き込み、別タブを開く
 * 2. Amazon 側（スクリプトの別エントリポイント）: ページロード後に
 *    window.location.href を GM_setValue で書き戻してタブを閉じる
 * 3. 本関数はポーリングで結果を待ち、取得後にキーを削除して返す
 *
 * タイムアウト時は null を返す。
 */
export function resolveAmazonUrlViaTab(url: string): Promise<string | null> {
  const POLL_INTERVAL_MS = 200;
  const TIMEOUT_MS = 15000;
  const reqKey = `amazon_resolve_req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const resKey = `amazon_resolve_res_${reqKey}`;

  return new Promise((resolve) => {
    // リクエストキーを書き込んでタブを開く
    GM_setValue(reqKey, url);
    GM.openInTab(url, { active: false, insert: true });

    const started = Date.now();
    const timer = setInterval(() => {
      const result = GM_getValue<string | null>(resKey, null);
      if (result !== null) {
        clearInterval(timer);
        GM_deleteValue(reqKey);
        GM_deleteValue(resKey);
        resolve(result === url ? null : result);
        return;
      }
      if (Date.now() - started > TIMEOUT_MS) {
        clearInterval(timer);
        GM_deleteValue(reqKey);
        resolve(null);
      }
    }, POLL_INTERVAL_MS);
  });
}

/**
 * Amazon Music ページ上で呼び出す。
 * SPA 遷移が完了した後の window.location.href を GM_setValue で書き戻し、タブを閉じる。
 * linkfire スクリプトの @match に music.amazon.co.jp/* を追加した上で、
 * 初期化時に isAmazonPage() が true の場合にこの関数を呼ぶ。
 */
export function handleAmazonResolvePage(): void {
  const SETTLE_MS = 1000; // SPA 遷移が落ち着くまで待つ時間

  // reqKey が存在しない（別タブ起動でない）場合は何もしない
  const keys = GM_listValues() as string[];
  const reqKey = keys.find((k) => k.startsWith("amazon_resolve_req_"));
  if (!reqKey) return;

  const resKey = `amazon_resolve_res_${reqKey}`;

  // SPA が遷移し終えるまで少し待ってから location.href を書き戻す
  setTimeout(() => {
    GM_setValue(resKey, window.location.href);
    window.close();
  }, SETTLE_MS);
}

/**
 * GM.xmlHttpRequest で手動リダイレクトを捕捉し、Location ヘッダ or finalUrl を返す。
 * リダイレクトなし・失敗時は null を返す。
 */
export function resolveRedirect(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      GM.xmlHttpRequest({
        method: "GET",
        url,
        redirect: "manual",
        timeout: RESOLVE_TIMEOUT_MS,
        onload: (res) => {
          const location =
            res.responseHeaders
              ?.split("\n")
              .find((l) => l.trim().toLowerCase().startsWith("location:"))
              ?.split(/:\s*/)[1]
              ?.split(/\s+/)[0]
              ?.trim() ?? null;
          if (location && location !== url) {
            resolve(location);
          } else if (res.finalUrl && res.finalUrl !== url) {
            resolve(res.finalUrl);
          } else {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null),
      });
    } catch {
      resolve(null);
    }
  });
}
