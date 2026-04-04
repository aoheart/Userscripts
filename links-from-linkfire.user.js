// ==UserScript==
// @name            Links from Linkfire
// @namespace       https://github.com/aoheart/Userscripts
// @version         2026.04.03
// @author          aoheart
// @description     Copy all Linkfire distribution links at once, or send them to MusicBrainz.
// @description:ja  Linkfireの配信リンクを一括でコピー、またはMusicBrainzに送信する
// @license         MIT
// @icon            data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNyAzMCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlYjc0M2I7fS5jbHMtMntmaWxsOiNiYTQ3OGY7fS5jbHMtM3tmaWxsOiNmZmZlZGI7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMy45NCAxIDEzLjk0IDI5IDI1LjkgMjIgMjUuOSA4IDEzLjk0IDEiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMTMuMDYgMSAxLjEgOCAxLjEgMjIgMTMuMDYgMjkgMTMuMDYgMSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjA2LDExLjIxLDcuNTIsMTQuNDJWMTIuMDhsNS41NC0zLjJWNC41TDYuNjQsOC4zOGgwbC0uMDYsMCwwLDAsMCwwLDAsMCwwLC4wNXMwLDAsMCwuMDUsMCwwLDAsMGEuMTQuMTQsMCwwLDAsMCwuMDYuNDMuNDMsMCwwLDAsMCwuMDV2MTBhMi42MSwyLjYxLDAsMCwwLTEuNTYuM0ExLjksMS45LDAsMCwwLDQsMjEuNTNhMS44NiwxLjg2LDAsMCwwLDIuNTcuMTgsMi40MywyLjQzLDAsMCwwLDEtMS40NmMwLS4wNiwwLTQuMzcsMC00LjM3bDUuNTQtMy4yMVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0yMy4zNSwxNy4zNmExLjk0LDEuOTQsMCwwLDAtMS42Ni0uOTIsMS45LDEuOSwwLDAsMC0uNTguMDksNS4xNyw1LjE3LDAsMCwwLTIuNS0xLjY1LDguNjEsOC42MSwwLDAsMCwxLjcyLTEuNzksMi4wNiwyLjA2LDAsMCwwLDEuNS0uMjQsMiwyLDAsMSwwLTIuNzItLjYybC4xMi4xN2E2Ljg1LDYuODUsMCwwLDEtMi43NywyLjI3aDBhNS4zOCw1LjM4LDAsMCwxLTIuNTEuNjJ2MS40NmE2LjM2LDYuMzYsMCwwLDAsMi45Mi0uODUsNC4zMyw0LjMzLDAsMCwxLDMuMiwxLjM5LDIsMiwwLDAsMCwyLjY4LDIuNzksMiwyLDAsMCwwLC42MS0yLjcyWm0tMy02LjgzYS43NS43NSwwLDAsMSwuNDEtLjEyLjc2Ljc2LDAsMCwxLC40MSwxLjQxLjczLjczLDAsMCwxLS40MS4xMi43Mi43MiwwLDAsMS0uNC0uMTIuNjkuNjksMCwwLDEtLjI0LS4yNEEuNzYuNzYsMCwwLDEsMjAuMzcsMTAuNTNabTIuMDYsOGEuNzcuNzcsMCwwLDEtLjc0LjYuNzcuNzcsMCwwLDEtLjQ1LTEuMzlsMCwwYS43Ny43NywwLDAsMSwxLC4yNEEuNzIuNzIsMCwwLDEsMjIuNDMsMTguNThaIi8+PC9zdmc+
// @supportURL      https://github.com/aoheart/Userscripts/issues
// @downloadURL     https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkfire.user.js
// @updateURL       https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkfire.user.js
// @match           https://*.lnk.to/*
// @match           https://*.amazon.co.jp/*
// @match           https://*.amazon.com/*
// @connect         musicbrainz.org
// @grant           GM.openInTab
// @grant           GM.xmlHttpRequest
// @grant           GM_deleteValue
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_setClipboard
// @grant           GM_setValue
// @grant           window.close
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULT_MB_ROOT = "https://musicbrainz.org";
  const createMBForm = (action, params, { method = "POST", mbRoot = DEFAULT_MB_ROOT } = {}) => {
    const form = document.createElement("form");
    form.method = method;
    form.action = `${mbRoot}${action}`;
    form.target = "_blank";
    form.style.display = "none";
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });
    return form;
  };
  const submitMBForm = (form) => {
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    form.appendChild(submitBtn);
    document.body.appendChild(form);
    submitBtn.click();
    requestAnimationFrame(() => form.remove());
  };
  const SEARCH_EXCLUDE = /\/search|\/searches|\/find|\/sch\b|[?&](q|query|keyword|key|keyWord|Keyword|w|search_word|kw|s|freeWord)=/i;
  const isSearchUrl = (url) => SEARCH_EXCLUDE.test(url);
  const KEEP_PARAMS = {
    "music.apple.com": new Set(["i"]),
    "itunes.apple.com": new Set(["i"]),
"music.163.com": new Set(["id"]),
    "y.qq.com": new Set(["albummid"]),
    "www.kuwo.cn": new Set(["id"]),
    "www.melon.com": new Set(["albumId"]),
    "www.genie.co.kr": new Set(["axnm"]),
    "www.music-flo.com": new Set(["id"])
  };
  function cleanUrl(rawUrl) {
    let u;
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
    let allowed;
    if (u.hostname === "music.youtube.com") {
      if (u.pathname.startsWith("/watch")) {
        allowed = new Set(["v"]);
      } else {
        allowed = new Set(["list"]);
      }
    } else {
      allowed = KEEP_PARAMS[u.hostname] ?? new Set();
    }
    const cleaned = new URLSearchParams();
    for (const [key, val] of u.searchParams) {
      if (allowed.has(key)) cleaned.append(key, val);
    }
    u.search = cleaned.toString();
    return u.toString();
  }
  const DELAY_MIN_MS = 1e3;
  const DELAY_MAX_MS = 1e3;
  function randomDelay() {
    const ms = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function runWithConcurrency(tasks, limit = 2) {
    const results = new Array(tasks.length);
    let index = 0;
    async function worker(workerIndex) {
      while (index < tasks.length) {
        const i = index++;
        if (i > 0 || workerIndex > 0) await randomDelay();
        results[i] = await tasks[i]();
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, (_, wi) => worker(wi)));
    return results;
  }
  const RESOLVE_TIMEOUT_MS = 1e4;
  function fetchYtMusicOgUrl(playlistUrl) {
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
          ontimeout: () => resolve(null)
        });
      } catch {
        resolve(null);
      }
    });
  }
  const YT_PLAYLIST_RE = /music\.youtube\.com\/playlist\?.*list=OLAK5uy_/;
  const YT_WATCH_RE = /music\.youtube\.com\/watch\?/;
  function fetchYtBrowsePlaylistUrl(browseId) {
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
          ontimeout: () => resolve(browseUrl)
        });
      } catch {
        resolve(browseUrl);
      }
    });
  }
  async function resolveYtWatchUrlViaTab(watchUrl) {
    const POLL_INTERVAL_MS = 100;
    const TIMEOUT_MS = 15e3;
    const reqKey = `yt_watch_resolve_req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const resKey = `yt_watch_resolve_res_${reqKey}`;
    const browseId = await new Promise((resolve) => {
      GM_setValue(reqKey, watchUrl);
      GM.openInTab(watchUrl, { active: true, insert: true });
      const started = Date.now();
      const timer = setInterval(() => {
        const result = GM_getValue(resKey, null);
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
    return fetchYtBrowsePlaylistUrl(browseId);
  }
  async function resolveYtWatchEntries(entries, onProgress) {
    const watchEntries = entries.filter((e) => YT_WATCH_RE.test(e.url));
    if (watchEntries.length === 0) return entries;
    let done = 0;
    onProgress(`⏳ 0/${watchEntries.length}件 YT watch解決中`, true);
    const watchMap = {};
    for (const entry of watchEntries) {
      watchMap[entry.url] = await resolveYtWatchUrlViaTab(entry.url);
      onProgress(`⏳ ${++done}/${watchEntries.length}件 YT watch解決中`, true);
    }
    return entries.map((e) => {
      if (!YT_WATCH_RE.test(e.url)) return e;
      const resolved = watchMap[e.url] ?? null;
      return resolved !== null ? { ...e, url: resolved } : e;
    });
  }
  async function resolveYtPlaylistEntries(entries, onProgress) {
    const ytEntries = entries.filter((e) => YT_PLAYLIST_RE.test(e.url));
    if (ytEntries.length === 0) return entries;
    let done = 0;
    onProgress(`⏳ 0/${ytEntries.length}件 YT解決中`, true);
    const tasks = ytEntries.map((entry) => async () => {
      const resolved = await fetchYtMusicOgUrl(entry.url);
      onProgress(`⏳ ${++done}/${ytEntries.length}件 YT解決中`, true);
      return [entry.url, resolved];
    });
    const ytMap = Object.fromEntries(await runWithConcurrency(tasks));
    return entries.map((e) => {
      if (!YT_PLAYLIST_RE.test(e.url)) return e;
      const resolved = ytMap[e.url] ?? null;
      return resolved !== null ? { ...e, url: resolved } : null;
    }).filter((e) => e !== null);
  }
  async function resolveYtEntries(entries, onProgress) {
    const afterWatch = await resolveYtWatchEntries(entries, onProgress);
    return resolveYtPlaylistEntries(afterWatch, onProgress);
  }
  async function resolveAmazonEntries(entries, onProgress) {
    const amazonEntries = entries.filter((e) => e.url.includes("amazon"));
    if (amazonEntries.length === 0) return entries;
    let done = 0;
    onProgress(`⏳ 0/${amazonEntries.length}件 Amazon解決中`, true);
    const amazonMap = {};
    for (const entry of amazonEntries) {
      const finalUrl = await resolveAmazonUrlViaTab(entry.url) ?? entry.url;
      const resolvedUrl = cleanUrl(finalUrl);
      amazonMap[entry.url] = { url: resolvedUrl, linkTypes: resolveAmazonLinkTypes(resolvedUrl) };
      onProgress(`⏳ ${++done}/${amazonEntries.length}件 Amazon解決中`, true);
    }
    return entries.map((e) => e.url.includes("amazon") ? amazonMap[e.url] ?? e : e);
  }
  const MB_HOSTS = ["musicbrainz.org", "beta.musicbrainz.org", "test.musicbrainz.org", "musicbrainz.eu"];
  function extractReleaseMbid(input) {
    const trimmed = input.trim();
    const m = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!m) return null;
    const mbid = m[0].toLowerCase();
    let host = "musicbrainz.org";
    try {
      const u = new URL(trimmed);
      if (MB_HOSTS.includes(u.hostname)) host = u.hostname;
    } catch {
    }
    return { mbid, host };
  }
  function buildEditNote() {
    const name = GM_info?.script?.name ?? "unknown script";
    const version = GM_info?.script?.version;
    const label = version ? `${name} (${version})` : name;
    return `${window.location.href}
---
${label}`;
  }
  function seedToMusicBrainz(entries, parsed) {
    const host = parsed?.host ?? "musicbrainz.org";
    const mbRoot = `https://${host}`;
    const action = parsed ? `/release/${parsed.mbid}/edit` : "/release/add";
    const params = {};
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
  function resolveAmazonLinkTypes(url) {
    try {
      const { hostname, pathname } = new URL(url);
      if (hostname.startsWith("music.amazon.")) return [980];
      if (hostname.startsWith("www.amazon.") && pathname.startsWith("/music/")) return [77];
    } catch {
    }
    return [980];
  }
  const EXCLUDED_HOSTS = new Set(["dhits.docomo.ne.jp"]);
  function resolveAmazonUrlViaTab(url) {
    const POLL_INTERVAL_MS = 200;
    const TIMEOUT_MS = 15e3;
    const reqKey = `amazon_resolve_req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const resKey = `amazon_resolve_res_${reqKey}`;
    return new Promise((resolve) => {
      GM_setValue(reqKey, url);
      GM.openInTab(url, { active: false, insert: true });
      const started = Date.now();
      const timer = setInterval(() => {
        const result = GM_getValue(resKey, null);
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
  function handleAmazonResolvePage() {
    const SETTLE_MS = 1e3;
    const keys = GM_listValues();
    const reqKey = keys.find((k) => k.startsWith("amazon_resolve_req_"));
    if (!reqKey) return;
    const resKey = `amazon_resolve_res_${reqKey}`;
    setTimeout(() => {
      GM_setValue(resKey, window.location.href);
      window.close();
    }, SETTLE_MS);
  }
  const UNKNOWN_SERVICE_ID = "__unknown__";
  function createImporterSettings(key, defaultEnabledIds) {
    function load() {
      const raw = GM_getValue(key, null);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    function save(settings2) {
      GM_setValue(key, JSON.stringify(settings2));
    }
    function getEnabledIds() {
      const saved = load();
      if (!saved || !Array.isArray(saved.enabledIds)) return defaultEnabledIds();
      return saved.enabledIds;
    }
    function getShowSettingsBtn() {
      return load()?.showSettingsBtn ?? true;
    }
    function getShowCopyBtn() {
      return load()?.showCopyBtn ?? true;
    }
    function getIncludeHiRes() {
      return load()?.includeHiRes ?? false;
    }
    function saveAll(enabledIds, showSettingsBtn, showCopyBtn, includeHiRes = false) {
      save({ enabledIds, showSettingsBtn, showCopyBtn, includeHiRes });
    }
    return { getEnabledIds, getShowSettingsBtn, getShowCopyBtn, getIncludeHiRes, saveAll };
  }
  function createStyledButton(text, bg, color) {
    const btn = document.createElement("button");
    btn.textContent = text;
    Object.assign(btn.style, {
      background: bg,
      color,
      border: "none",
      borderRadius: "6px",
      padding: "7px 16px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "bold"
    });
    return btn;
  }
  function buildSettingsModal(opts) {
    const { services, isEnabled, onSave, showSettingsBtn, showCopyBtn, includeHiRes, unknownSection } = opts;
    const overlay = document.createElement("div");
    overlay.tabIndex = -1;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    overlay.tabIndex = -1;
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.55)",
      zIndex: "999998",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });
    const modal = document.createElement("div");
    Object.assign(modal.style, {
      background: "#1e1e2e",
      color: "#cdd6f4",
      border: "1px solid #45475a",
      borderRadius: "12px",
      padding: "24px 0 24px 24px",
      minWidth: "240px",
      maxWidth: "320px",
      maxHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      zIndex: "999999"
    });
    const title = document.createElement("div");
    title.textContent = "⚙ 設定";
    Object.assign(title.style, {
      fontSize: "15px",
      fontWeight: "bold",
      marginBottom: "16px",
      color: "#89b4fa",
      flexShrink: "0"
    });
    modal.appendChild(title);
    const scrollArea = document.createElement("div");
    Object.assign(scrollArea.style, {
      overflowY: "auto",
      flex: "1",
      paddingRight: "24px"
    });
    const allCheckboxes = [];
    let lastCheckedIndex = -1;
    const CB_STYLE = {
      width: "16px",
      height: "16px",
      minWidth: "16px",
      cursor: "pointer",
      appearance: "auto",
      opacity: "1",
      visibility: "visible",
      display: "inline-block",
      margin: "0",
      padding: "0",
      accentColor: "#89b4fa"
    };
    function makeRow(container, id, labelText, checked, unverified) {
      const row = document.createElement("label");
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "5px 0"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = id;
      cb.checked = checked;
      Object.assign(cb.style, CB_STYLE);
      cb.addEventListener("click", (e) => {
        const currentIndex = allCheckboxes.indexOf(cb);
        if (e.shiftKey && lastCheckedIndex !== -1) {
          const from = Math.min(lastCheckedIndex, currentIndex);
          const to = Math.max(lastCheckedIndex, currentIndex);
          for (let i = from; i <= to; i++) allCheckboxes[i].checked = cb.checked;
        }
        lastCheckedIndex = currentIndex;
      });
      const lbl = document.createElement("span");
      lbl.textContent = labelText;
      if (unverified) {
        const note = document.createElement("span");
        note.textContent = " (動作未確認)";
        Object.assign(note.style, { fontSize: "0.8em", opacity: "0.6" });
        lbl.appendChild(note);
      }
      row.appendChild(cb);
      row.appendChild(lbl);
      container.appendChild(row);
      allCheckboxes.push(cb);
      return cb;
    }
    const hasCopySettings = includeHiRes !== void 0 || !!unknownSection;
    if (hasCopySettings) {
      const copySettingsTitle = document.createElement("div");
      copySettingsTitle.textContent = "コピー設定";
      Object.assign(copySettingsTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
      scrollArea.appendChild(copySettingsTitle);
    }
    let hiResCb = null;
    if (includeHiRes !== void 0) {
      const hiResSection = document.createElement("div");
      const hiResRow = document.createElement("label");
      Object.assign(hiResRow.style, {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "5px 0"
      });
      hiResCb = document.createElement("input");
      hiResCb.type = "checkbox";
      hiResCb.checked = includeHiRes;
      Object.assign(hiResCb.style, CB_STYLE);
      const hiResLbl = document.createElement("span");
      hiResLbl.textContent = "ハイレゾリンクもコピーする";
      hiResRow.appendChild(hiResCb);
      hiResRow.appendChild(hiResLbl);
      hiResSection.appendChild(hiResRow);
      scrollArea.appendChild(hiResSection);
    }
    let unknownCb = null;
    if (unknownSection) {
      const section = document.createElement("div");
      const row = document.createElement("label");
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "5px 0"
      });
      unknownCb = document.createElement("input");
      unknownCb.type = "checkbox";
      unknownCb.checked = unknownSection.checked;
      Object.assign(unknownCb.style, CB_STYLE);
      const lbl = document.createElement("span");
      lbl.textContent = "テーブル外のサービスをコピー";
      row.appendChild(unknownCb);
      row.appendChild(lbl);
      section.appendChild(row);
      if (unknownSection.labelsOnPage.length > 0) {
        const note = document.createElement("div");
        note.textContent = `このページの未知サービス: ${unknownSection.labelsOnPage.join(", ")}`;
        Object.assign(note.style, {
          fontSize: "11px",
          color: "#a6adc8",
          marginTop: "4px",
          paddingLeft: "26px",
          wordBreak: "break-all"
        });
        section.appendChild(note);
      }
      scrollArea.appendChild(section);
    }
    const normalServices = services.filter((s) => !s.isHarmony);
    const harmonyServices = services.filter((s) => s.isHarmony);
    const hasAboveServices = includeHiRes !== void 0 || !!unknownSection;
    if (normalServices.length > 0) {
      const section = document.createElement("div");
      Object.assign(section.style, {
        marginTop: hasAboveServices ? "16px" : "0",
        paddingTop: hasAboveServices ? "12px" : "0",
        borderTop: hasAboveServices ? "1px solid #45475a" : "none"
      });
      const servicesTitle = document.createElement("div");
      servicesTitle.textContent = "コピー対象サービス";
      Object.assign(servicesTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
      section.appendChild(servicesTitle);
      for (const svc of normalServices) {
        makeRow(section, svc.id, svc.label, isEnabled(svc.id), svc.unverified);
      }
      scrollArea.appendChild(section);
    }
    if (harmonyServices.length > 0) {
      const hasAboveHarmony = normalServices.length > 0 || hasAboveServices;
      const section = document.createElement("div");
      Object.assign(section.style, {
        marginTop: hasAboveHarmony ? "16px" : "0",
        paddingTop: hasAboveHarmony ? "12px" : "0",
        borderTop: hasAboveHarmony ? "1px solid #45475a" : "none"
      });
      if (normalServices.length === 0) {
        const servicesTitle = document.createElement("div");
        servicesTitle.textContent = "コピー対象サービス";
        Object.assign(servicesTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
        section.appendChild(servicesTitle);
      }
      const header = document.createElement("div");
      Object.assign(header.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
      const makeToolLink = (text, href) => {
        const a = document.createElement("a");
        a.textContent = text;
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener";
        Object.assign(a.style, { color: "#89b4fa", textDecoration: "none" });
        return a;
      };
      header.append("💡 ", makeToolLink("Harmony", "https://harmony.pulsewidth.org.uk/"), " / ", makeToolLink("a-tisket", "https://atisket.pulsewidth.org.uk/"), " の使用を推奨");
      section.appendChild(header);
      for (const svc of harmonyServices) {
        makeRow(section, svc.id, svc.label, isEnabled(svc.id), svc.unverified);
      }
      scrollArea.appendChild(section);
    }
    const uiSection = document.createElement("div");
    const hasAboveUi = normalServices.length > 0 || harmonyServices.length > 0 || !!unknownSection;
    Object.assign(uiSection.style, {
      marginTop: hasAboveUi ? "16px" : "0",
      paddingTop: hasAboveUi ? "12px" : "0",
      borderTop: hasAboveUi ? "1px solid #45475a" : "none"
    });
    const uiSectionTitle = document.createElement("div");
    uiSectionTitle.textContent = "UI";
    Object.assign(uiSectionTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
    uiSection.appendChild(uiSectionTitle);
    const showBtnRow = document.createElement("label");
    Object.assign(showBtnRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "5px 0"
    });
    const showBtnCb = document.createElement("input");
    showBtnCb.type = "checkbox";
    showBtnCb.checked = showSettingsBtn;
    Object.assign(showBtnCb.style, CB_STYLE);
    const showBtnLbl = document.createElement("span");
    showBtnLbl.textContent = "設定ボタン（⚙）を表示する";
    showBtnRow.appendChild(showBtnCb);
    showBtnRow.appendChild(showBtnLbl);
    uiSection.appendChild(showBtnRow);
    const showCopyRow = document.createElement("label");
    Object.assign(showCopyRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "5px 0"
    });
    const showCopyCb = document.createElement("input");
    showCopyCb.type = "checkbox";
    showCopyCb.checked = showCopyBtn;
    Object.assign(showCopyCb.style, CB_STYLE);
    const showCopyLbl = document.createElement("span");
    showCopyLbl.textContent = "コピーボタンを表示する";
    showCopyRow.appendChild(showCopyCb);
    showCopyRow.appendChild(showCopyLbl);
    uiSection.appendChild(showCopyRow);
    scrollArea.appendChild(uiSection);
    modal.appendChild(scrollArea);
    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "16px",
      paddingRight: "24px",
      flexShrink: "0"
    });
    function closeModal() {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      overlay.remove();
    }
    const cancelBtn = createStyledButton("キャンセル", "#45475a", "#cdd6f4");
    cancelBtn.addEventListener("click", closeModal);
    const saveBtn = createStyledButton("保存", "#89b4fa", "#1e1e2e");
    saveBtn.addEventListener("click", () => {
      const enabledIds = allCheckboxes.filter((c) => c.checked).map((c) => c.value);
      if (unknownCb?.checked) enabledIds.push(UNKNOWN_SERVICE_ID);
      onSave({
        enabledIds,
        showSettingsBtn: showBtnCb.checked,
        showCopyBtn: showCopyCb.checked,
        includeHiRes: hiResCb?.checked ?? false
      });
      closeModal();
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter") saveBtn.click();
    });
    requestAnimationFrame(() => overlay.focus());
    return overlay;
  }
  function registerMenuCommand(openModal) {
    GM_registerMenuCommand("⚙ MBインポーター設定を開く", openModal);
  }
  function createWidgetButton(text, bg, color) {
    const btn = document.createElement("button");
    btn.textContent = text;
    Object.assign(btn.style, {
      background: bg,
      color,
      border: "none",
      borderRadius: "8px",
      padding: "8px 18px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "bold",
      fontFamily: "system-ui, sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      transition: "opacity 0.2s"
    });
    return btn;
  }
  function makeProcessingButton(btn, _defaultLabel) {
    return (label, processing) => {
      btn.textContent = label;
      btn.disabled = processing;
      btn.style.opacity = processing ? "0.7" : "1";
      btn.style.cursor = processing ? "wait" : "pointer";
    };
  }
  function buildImporterWidget(opts) {
    const { collectUrls: collectUrls2, openSettings, showSettingsBtn, showCopyBtn, mount } = opts;
    let cachedEntries = null;
    async function getEntries(onProgress) {
      if (cachedEntries) return { entries: cachedEntries };
      const result = await collectUrls2(onProgress);
      if ("entries" in result) cachedEntries = result.entries;
      return result;
    }
    async function collectAndCopy(setState) {
      const result = await getEntries(setState);
      if ("error" in result) {
        setState(result.error === "nolinks" ? "⚠ リンクなし" : "⚠ 対象URL無し", false);
      } else {
        GM_setClipboard(result.entries.map((e) => e.url).join("\n"), "text");
        setState(`✓ ${result.entries.length}件 コピー済`, false);
      }
      setTimeout(() => setState("copy", false), 2500);
    }
    async function collectAndSeed(parsed, setState) {
      const result = await getEntries(setState);
      if ("error" in result) {
        setState(result.error === "nolinks" ? "⚠ リンクなし" : "⚠ 対象URL無し", false);
      } else {
        seedToMusicBrainz(result.entries, parsed);
        setState(`✓ ${result.entries.length}件 Seed済`, false);
      }
      setTimeout(() => setState("send", false), 2500);
    }
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "8px",
      margin: "12px 16px"
    });
    const leftGroup = document.createElement("div");
    Object.assign(leftGroup.style, { display: "flex", alignItems: "center", gap: "8px" });
    const rightGroup = document.createElement("div");
    Object.assign(rightGroup.style, { display: "flex", alignItems: "center", gap: "8px" });
    const copyButton = createWidgetButton("copy", "linear-gradient(135deg, #89b4fa, #b4befe)", "#1e1e2e");
    copyButton.style.display = showCopyBtn ? "" : "none";
    let isCopyProcessing = false;
    const setCopyState = makeProcessingButton(copyButton);
    const setCopyStateGuarded = (label, processing) => {
      isCopyProcessing = processing;
      setCopyState(label, processing);
    };
    copyButton.addEventListener("click", () => {
      if (!isCopyProcessing) collectAndCopy(setCopyStateGuarded);
    });
    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "⚙";
    settingsBtn.title = "コピー対象サービスを設定";
    Object.assign(settingsBtn.style, {
      background: "#313244",
      color: "#cdd6f4",
      border: "1px solid #45475a",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "system-ui, sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      display: showSettingsBtn ? "" : "none"
    });
    settingsBtn.addEventListener("click", () => openSettings());
    const mbidInput = document.createElement("input");
    mbidInput.type = "text";
    mbidInput.placeholder = "Release MBID or MusicBrainz URL";
    Object.assign(mbidInput.style, {
      background: "#313244",
      color: "#cdd6f4",
      border: "1px solid #45475a",
      borderRadius: "8px",
      padding: "7px 10px",
      fontSize: "12px",
      fontFamily: "system-ui, sans-serif",
      width: "260px",
      outline: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      transition: "border-color 0.15s"
    });
    mbidInput.addEventListener("input", () => {
      const val = mbidInput.value.trim();
      mbidInput.style.borderColor = val === "" || extractReleaseMbid(val) !== null ? "#45475a" : "#f38ba8";
    });
    const seedButton = createWidgetButton("send", "#ba478f", "#cdd6f4");
    seedButton.style.whiteSpace = "nowrap";
    let isSeedProcessing = false;
    const setSeedState = makeProcessingButton(seedButton);
    const setSeedStateGuarded = (label, processing) => {
      isSeedProcessing = processing;
      setSeedState(label, processing);
    };
    function doSeed() {
      if (isSeedProcessing) return;
      const val = mbidInput.value.trim();
      const parsed = val === "" ? null : extractReleaseMbid(val);
      if (val !== "" && parsed === null) {
        mbidInput.style.borderColor = "#f38ba8";
        mbidInput.focus();
        return;
      }
      collectAndSeed(parsed, setSeedStateGuarded);
    }
    seedButton.addEventListener("click", doSeed);
    mbidInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSeed();
    });
    leftGroup.appendChild(copyButton);
    leftGroup.appendChild(settingsBtn);
    rightGroup.appendChild(mbidInput);
    rightGroup.appendChild(seedButton);
    wrapper.appendChild(leftGroup);
    wrapper.appendChild(rightGroup);
    mount(wrapper);
    return {
      clearCache: () => {
        cachedEntries = null;
      }
    };
  }
  const SERVICE_DEFINITIONS = [
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
    { id: "playnetwork", label: "PlayNetwork", isDefaultEnabled: false, linkTypes: [] }
  ];
  const SERVICE_MAP = new Map(SERVICE_DEFINITIONS.map((s) => [s.id, s]));
  const LABEL_ALIASES = {
    itunes: "applemusic"
  };
  const EXCLUDED_LABELS = new Set(["linkfire"]);
  const LM_LAUNCH_RE = /^https:\/\/music\.line\.me\/launch\b/;
  function convertLineMusicUrl(url) {
    let u;
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
  const settings = createImporterSettings("lnkto_mb_service_settings", () => [...SERVICE_DEFINITIONS.filter((s) => s.isDefaultEnabled).map((s) => s.id), UNKNOWN_SERVICE_ID]);
  async function collectUrls(onProgress) {
    const anchors = Array.from(document.querySelectorAll("#music-services a[href][data-label]"));
    if (anchors.length === 0) return { error: "nolinks" };
    const enabledIds = settings.getEnabledIds();
    const includeUnknown = enabledIds.includes(UNKNOWN_SERVICE_ID);
    const includeHiRes = settings.getIncludeHiRes();
    const seenUrls = new Set();
    const rawEntries = [];
    for (const a of anchors) {
      const rawLabel = a.dataset.label ?? "";
      if (EXCLUDED_LABELS.has(rawLabel)) continue;
      const label = LABEL_ALIASES[rawLabel] ?? rawLabel;
      const svc = SERVICE_MAP.get(label);
      const isKnown = svc !== void 0;
      if (isKnown && svc.isHiRes && !includeHiRes) continue;
      if (isKnown && !svc.isHiRes && !enabledIds.includes(label)) continue;
      if (!isKnown && !includeUnknown) continue;
      const href = LM_LAUNCH_RE.test(a.href) ? convertLineMusicUrl(a.href) ?? a.href : a.href;
      try {
        if (EXCLUDED_HOSTS.has(new URL(href).hostname)) continue;
      } catch {
      }
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
  function openSettingsModal(clearCache) {
    const anchors = Array.from(document.querySelectorAll("#music-services a[href][data-label]"));
    const labelsOnPage = new Set(
      anchors.filter((a) => {
        try {
          return !EXCLUDED_HOSTS.has(new URL(a.href).hostname);
        } catch {
          return true;
        }
      }).map((a) => LABEL_ALIASES[a.dataset.label ?? ""] ?? a.dataset.label ?? "").filter((l) => l && !EXCLUDED_LABELS.has(l))
    );
    const unknownLabelsOnPage = [...labelsOnPage].filter((l) => !SERVICE_MAP.has(l));
    const enabledIds = settings.getEnabledIds();
    document.body.appendChild(
      buildSettingsModal({
        services: SERVICE_DEFINITIONS.filter((s) => !s.isHiRes).map(
          (s) => ({
            id: s.id,
            label: s.label,
            isHarmony: s.isHarmony
          })
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
          labelsOnPage: unknownLabelsOnPage
        }
      })
    );
  }
  function injectUI() {
    const headerLink = document.querySelector(".header__link");
    if (!headerLink) return;
    let clearCache = () => {
    };
    ({ clearCache } = buildImporterWidget({
      collectUrls,
      openSettings: () => openSettingsModal(clearCache),
      showSettingsBtn: settings.getShowSettingsBtn(),
      showCopyBtn: settings.getShowCopyBtn(),
      mount: (wrapper) => headerLink.insertAdjacentElement("afterend", wrapper)
    }));
  }
  if (location.hostname.includes("amazon")) {
    handleAmazonResolvePage();
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectUI);
    } else {
      injectUI();
    }
    registerMenuCommand(() => openSettingsModal(() => {
    }));
  }

})();