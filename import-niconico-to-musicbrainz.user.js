// ==UserScript==
// @name            Import Niconico to MusicBrainz
// @namespace       https://github.com/aoheart/Userscripts
// @version         2026.04.03
// @author          aoheart
// @description     Helps importing music metadata from Niconico into MusicBrainz.
// @description:ja  ニコニコ動画からMusicBrainzへのインポートを支援する機能を追加します。
// @license         MIT
// @icon            data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNyAzMCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlYjc0M2I7fS5jbHMtMntmaWxsOiNiYTQ3OGY7fS5jbHMtM3tmaWxsOiNmZmZlZGI7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMy45NCAxIDEzLjk0IDI5IDI1LjkgMjIgMjUuOSA4IDEzLjk0IDEiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMTMuMDYgMSAxLjEgOCAxLjEgMjIgMTMuMDYgMjkgMTMuMDYgMSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjA2LDExLjIxLDcuNTIsMTQuNDJWMTIuMDhsNS41NC0zLjJWNC41TDYuNjQsOC4zOGgwbC0uMDYsMCwwLDAsMCwwLDAsMCwwLC4wNXMwLDAsMCwuMDUsMCwwLDAsMGEuMTQuMTQsMCwwLDAsMCwuMDYuNDMuNDMsMCwwLDAsMCwuMDV2MTBhMi42MSwyLjYxLDAsMCwwLTEuNTYuM0ExLjksMS45LDAsMCwwLDQsMjEuNTNhMS44NiwxLjg2LDAsMCwwLDIuNTcuMTgsMi40MywyLjQzLDAsMCwwLDEtMS40NmMwLS4wNiwwLTQuMzcsMC00LjM3bDUuNTQtMy4yMVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0yMy4zNSwxNy4zNmExLjk0LDEuOTQsMCwwLDAtMS42Ni0uOTIsMS45LDEuOSwwLDAsMC0uNTguMDksNS4xNyw1LjE3LDAsMCwwLTIuNS0xLjY1LDguNjEsOC42MSwwLDAsMCwxLjcyLTEuNzksMi4wNiwyLjA2LDAsMCwwLDEuNS0uMjQsMiwyLDAsMSwwLTIuNzItLjYybC4xMi4xN2E2Ljg1LDYuODUsMCwwLDEtMi43NywyLjI3aDBhNS4zOCw1LjM4LDAsMCwxLTIuNTEuNjJ2MS40NmE2LjM2LDYuMzYsMCwwLDAsMi45Mi0uODUsNC4zMyw0LjMzLDAsMCwxLDMuMiwxLjM5LDIsMiwwLDAsMCwyLjY4LDIuNzksMiwyLDAsMCwwLC42MS0yLjcyWm0tMy02LjgzYS43NS43NSwwLDAsMSwuNDEtLjEyLjc2Ljc2LDAsMCwxLC40MSwxLjQxLjczLjczLDAsMCwxLS40MS4xMi43Mi43MiwwLDAsMS0uNC0uMTIuNjkuNjksMCwwLDEtLjI0LS4yNEEuNzYuNzYsMCwwLDEsMjAuMzcsMTAuNTNabTIuMDYsOGEuNzcuNzcsMCwwLDEtLjc0LjYuNzcuNzcsMCwwLDEtLjQ1LTEuMzlsMCwwYS43Ny43NywwLDAsMSwxLC4yNEEuNzIuNzIsMCwwLDEsMjIuNDMsMTguNThaIi8+PC9zdmc+
// @supportURL      https://github.com/aoheart/Userscripts/issues
// @downloadURL     https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-niconico-to-musicbrainz.user.js
// @updateURL       https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-niconico-to-musicbrainz.user.js
// @match           https://www.nicovideo.jp/*
// @connect         musicbrainz.org
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_registerMenuCommand
// @grant           GM_setClipboard
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const mbicon = "data:image/svg+xml,%3csvg%20id='Layer_1'%20data-name='Layer%201'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2027%2030'%3e%3cdefs%3e%3cstyle%3e.cls-1{fill:%23ba478f;}.cls-2{fill:%23eb743b;}%3c/style%3e%3c/defs%3e%3cpolygon%20class='cls-1'%20points='13%201%201%208%201%2022%2013%2029%2013%201'/%3e%3cpolygon%20class='cls-2'%20points='14%201%2026%208%2026%2022%2014%2029%2014%201'/%3e%3c/svg%3e";
  let _cachedLang;
  const detectLang = () => {
    if (_cachedLang) return _cachedLang;
    const langs = navigator.languages ?? [navigator.language];
    for (const lang of langs) {
      const code = lang.split("-")[0].toLowerCase();
      if (code) return _cachedLang = code;
    }
    return _cachedLang = "en";
  };
  const createI18n = (data) => {
    const lang = detectLang();
    const resolved = lang in data ? lang : "en";
    return {
      lang: resolved,
      t(key) {
        return data[resolved]?.[key] ?? data["en"]?.[key] ?? key;
      }
    };
  };
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
  const MB_DESIGN = {
    brandColor: "#ba478f",
    brandHover: "#a53f7c",
    disabledBg: "#c0a0b4",
    errorColor: "#d9534f"
  };
  const syncMBButtons = (selector, pending, loadingLabel) => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.disabled = pending;
      btn.textContent = pending ? loadingLabel : btn.getAttribute("data-original-label") ?? "";
    });
  };
  const mbButtonBaseStyle = (className, opts = {}) => {
    const { height = "32px", padding = "0 12px", borderRadius = "6px", fontSize = "13px", fontWeight = "600", brandColor = MB_DESIGN.brandColor, brandHover = MB_DESIGN.brandHover, disabledBg = MB_DESIGN.disabledBg } = opts;
    return `
    .${className} {
        all: unset;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: ${height} !important;
        padding: ${padding} !important;
        background-color: ${brandColor} !important;
        color: #fff !important;
        border-radius: ${borderRadius} !important;
        font-size: ${fontSize} !important;
        font-weight: ${fontWeight} !important;
        cursor: pointer !important;
        white-space: nowrap !important;
        transition: background-color 0.2s !important;
        font-family: sans-serif !important;
        box-sizing: border-box !important;
    }
    .${className}:hover:not(:disabled):not([disabled]) {
        background-color: ${brandHover} !important;
    }
    .${className}:disabled,
    .${className}[disabled] {
        background-color: ${disabledBg} !important;
        cursor: not-allowed !important;
        opacity: 0.8 !important;
    }
  `.trim();
  };
  const createMBButton = (opts) => {
    const { id, className, label, loadingLabel, pending, onClick } = opts;
    const btn = document.createElement("button");
    btn.id = id;
    btn.className = className;
    btn.setAttribute("data-original-label", label);
    if (onClick) btn.onclick = onClick;
    btn.textContent = label;
    btn.style.visibility = "hidden";
    document.body.appendChild(btn);
    btn.style.minWidth = `${btn.offsetWidth}px`;
    document.body.removeChild(btn);
    btn.style.visibility = "";
    btn.disabled = pending;
    btn.textContent = pending ? loadingLabel : label;
    return btn;
  };
  const createMBIconLink = (opts) => {
    const { id, href, iconSrc, tooltip, fallbackText = "(MB✓)", className = "mb-icon-link", iconClassName = "mb-icon-img" } = opts;
    const link = document.createElement("a");
    link.id = id;
    link.className = className;
    link.href = href;
    link.target = "_blank";
    link.title = tooltip;
    const img = document.createElement("img");
    img.src = iconSrc;
    img.className = iconClassName;
    img.onerror = () => {
      img.style.display = "none";
      link.insertAdjacentHTML("beforeend", `<span style="font-size:14px;color:${MB_DESIGN.brandColor};font-weight:bold;">${fallbackText}</span>`);
    };
    link.appendChild(img);
    return link;
  };
  class MusicBrainzApiClient {
    endpoint;
    _rateMs;
    _timeoutMs;
    _cacheTtlMs;
    _apiUserAgent;
    _cache;
    _queue;
    _running;
    constructor({ appName, appVersion, appContact, endpoint = "https://musicbrainz.org", rateMs = 1e3, timeoutMs = 1e4 }) {
      this.endpoint = endpoint;
      this._rateMs = rateMs;
      this._timeoutMs = timeoutMs;
      this._cacheTtlMs = 6e4;
      this._apiUserAgent = `${appName}/${appVersion} ( ${appContact} )`;
      this._cache = new Map();
      this._queue = [];
      this._running = false;
    }
    async fetchUrls(resourceUrls, includes) {
      const CHUNK_SIZE = 100;
      const incParam = [...includes].sort().join("+");
      if (resourceUrls.length <= CHUNK_SIZE) {
        return this._cachedRequest(this._buildUrl(resourceUrls, incParam));
      }
      const merged = [];
      for (let i = 0; i < resourceUrls.length; i += CHUNK_SIZE) {
        const chunk = resourceUrls.slice(i, i + CHUNK_SIZE);
        const data = await this._cachedRequest(this._buildUrl(chunk, incParam));
        const urls = Array.isArray(data.urls) ? data.urls : data.resource ? [{ id: data.id ?? "", resource: data.resource, relations: data.relations ?? [] }] : [];
        merged.push(...urls);
      }
      return {
        "url-count": merged.length,
        "url-offset": 0,
        urls: merged,
        id: "",
        relations: []
      };
    }
    _buildUrl(resourceUrls, incParam) {
      const resourceParams = resourceUrls.map((u) => `resource=${encodeURIComponent(u)}`).join("&");
      return `${this.endpoint}/ws/2/url?${resourceParams}${incParam ? `&inc=${incParam}` : ""}&fmt=json`;
    }
    _cachedRequest(url) {
      const cached = this._cache.get(url);
      if (cached) return cached;
      const promise = new Promise((resolve, reject) => {
        this._queue.push({ url, resolve, reject });
        if (!this._running) {
          this._running = true;
          void this._pump();
        }
      });
      void promise.finally(() => {
        setTimeout(() => this._cache.delete(url), this._cacheTtlMs);
      });
      this._cache.set(url, promise);
      return promise;
    }
    async _pump() {
      while (true) {
        const task = this._queue.shift();
        if (!task) break;
        const { url, resolve, reject } = task;
        try {
          resolve(await this._fetch(url));
        } catch (err) {
          this._cache.delete(url);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
        if (this._queue.length > 0) {
          await new Promise((resolve2) => setTimeout(resolve2, this._rateMs));
        }
      }
      this._running = false;
    }
    _fetch(url) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: this._timeoutMs,
          headers: {
            Accept: "application/json",
            "User-Agent": this._apiUserAgent
          },
          onload(res) {
            if (res.status !== 200) {
              reject(new Error(`HTTP ${res.status}`));
              return;
            }
            let parsed;
            try {
              parsed = JSON.parse(res.responseText);
            } catch {
              reject(new Error("JSON Parse failed"));
              return;
            }
            resolve(parsed);
          },
          onerror: () => reject(new Error("Network Error")),
          ontimeout: () => reject(new Error("Timeout"))
        });
      });
    }
  }
  const getRelationsByType = (entry, targetType) => {
    if (!entry) return [];
    return entry.relations.filter((r) => r["target-type"] === targetType);
  };
  class MBQueryExecutor {
    constructor(mb) {
      this.mb = mb;
    }
    async execute(queries) {
      if (queries.length === 0) return {};
      const groups = new Map();
      for (const q of queries) {
        const groupKey = [...q.includes].sort().join("+");
        const group = groups.get(groupKey);
        if (group) {
          group.urls.push(q.url);
        } else {
          groups.set(groupKey, { urls: [q.url], includes: [...q.includes].sort() });
        }
      }
      const entryMap = new Map();
      const errors = [];
      await Promise.all(
        Array.from(groups.values()).map(async ({ urls, includes }) => {
          try {
            const data = await this.mb.fetchUrls(urls, includes);
            const entries = Array.isArray(data.urls) ? data.urls : data.resource ? [{ id: data.id ?? "", resource: data.resource, relations: data.relations ?? [] }] : [];
            const resourceMap = new Map();
            for (const e of entries) {
              resourceMap.set(e.resource, e);
              try {
                resourceMap.set(decodeURIComponent(e.resource), e);
              } catch {
              }
            }
            for (const url of urls) {
              let decoded;
              try {
                decoded = decodeURIComponent(url);
              } catch {
              }
              const entry = resourceMap.get(url) ?? (decoded ? resourceMap.get(decoded) : void 0) ?? null;
              if (entry) entryMap.set(url, entry);
            }
          } catch (e) {
            if (e instanceof Error && e.message === "HTTP 404") return;
            errors.push(e);
          }
        })
      );
      if (errors.length > 0) throw errors[0];
      return Object.fromEntries(queries.map((q) => [q.key, entryMap.get(q.url) ?? null]));
    }
  }
  const createImporterRunner = (options) => {
    const mb = new MusicBrainzApiClient(options);
    const executor = new MBQueryExecutor(mb);
    return {
      resolveEntityHref(rels, entityType, urlEntityId) {
        if (rels.length === 0) return null;
        if (rels.length === 1) {
          const id = rels[0][entityType]?.id;
          if (id) return `${mb.endpoint}/${entityType}/${id}`;
        }
        return urlEntityId ? `${mb.endpoint}/url/${urlEntityId}` : null;
      },
      resolveUrlHref(urlEntityId) {
        return `${mb.endpoint}/url/${urlEntityId}`;
      },
      resolveMbidHref(entityType, mbid) {
        return `${mb.endpoint}/${entityType}/${mbid}`;
      },
      async run(importer, token, onAttach, onUpdate, onPendingChange, onStale, onApiError) {
        const { siteId } = importer;
        const ctx = importer.extractContext();
        if (!ctx) return;
        token.current = Symbol();
        const myToken = token.current;
        onAttach(ctx);
        const queries = importer.getQueries(ctx);
        if (queries.length === 0) return;
        onPendingChange?.(true);
        try {
          const entries = await executor.execute(queries);
          if (token.current !== myToken) {
            console.warn(`[MB:${siteId}] stale request ignored`);
            onStale?.();
            return;
          }
          onUpdate(ctx, entries);
        } catch (err) {
          console.error(`[MB:${siteId}] API error`, err);
          onApiError?.(err);
        } finally {
          if (token.current === myToken) {
            onPendingChange?.(false);
          }
        }
      }
    };
  };
  const i18n = createI18n({
    ja: {
      labelRecording: "レコーディング",
      labelRelease: "リリース",
      addRecording: "レコーディングを追加",
      addRelease: "リリースを追加",
      menuRecording: "レコーディングボタンを表示",
      menuRelease: "リリースボタンを表示",
      menuAutoCopy: "MBID/投稿者名を自動コピー",
      loadingApi: "MusicBrainzに照会中...",
      apiError: "MB APIエラー",
      tooltipRecording: "MusicBrainz: レコーディング登録済み",
      tooltipRelease: "MusicBrainz: リリース登録済み",
      tooltipArtist: "MusicBrainz: アーティスト登録済み",
      openOnMb: "MBで開く"
    },
    en: {
      labelRecording: "Recording",
      labelRelease: "Release",
      addRecording: "Add Recording",
      addRelease: "Add Release",
      menuRecording: "Show Recording Button",
      menuRelease: "Show Release Button",
      menuAutoCopy: "Auto-copy MBID/Author",
      loadingApi: "Querying usicBrainz...",
      apiError: "MB query failed",
      tooltipRecording: "MusicBrainz: Recording registered",
      tooltipRelease: "MusicBrainz: Release registered",
      tooltipArtist: "MusicBrainz: Artist registered",
      openOnMb: "Open on MB"
    }
  });
  class NiconicoScraper {
    analyze(videoId) {
      try {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]:not([data-mb-parsed])'));
        let videoObject = null;
        for (const s of scripts) {
          s.dataset.mbParsed = "1";
          try {
            const obj = JSON.parse(s.textContent ?? "");
            if (obj["@type"] === "VideoObject" && typeof obj["url"] === "string" && obj["url"].includes(videoId)) {
              videoObject = obj;
            }
          } catch {
          }
        }
        if (!videoObject || !videoObject["name"]) return null;
        const dateRaw = typeof videoObject["uploadDate"] === "string" ? videoObject["uploadDate"].split("T")[0].split("-") : ["", "", ""];
        const durMatch = typeof videoObject["duration"] === "string" ? videoObject["duration"].match(
/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?/
        ) : null;
        const author = videoObject["author"];
        const authorUrl = typeof author?.["url"] === "string" ? author["url"].split("?")[0] : "";
        return {
          title: videoObject["name"],
          author: author?.["name"] ?? "",
          authorUrl,
          released: {
            year: dateRaw[0] ?? "",
            month: dateRaw[1] ?? "",
            day: dateRaw[2] ?? ""
          },
          runtime: durMatch ? Math.round((parseFloat(durMatch[1] ?? "0") * 3600 + parseFloat(durMatch[2] ?? "0") * 60 + parseFloat(durMatch[3] ?? "0")) * 1e3) : null,
          sourceUrl: window.location.href.split("?")[0]
        };
      } catch {
        return null;
      }
    }
    hasVideoLdJson(videoId) {
      return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some((s) => (s.textContent ?? "").includes(videoId));
    }
  }
  class NiconicoViewModel {
    constructor(runner, iconSrc) {
      this.runner = runner;
      this.iconSrc = iconSrc;
    }
    buildVideoIndicators(sourceEntry, videoId) {
      if (!sourceEntry) return { mode: "single", links: [] };
      const links = ["recording", "release"].flatMap((category) => {
        const rels = getRelationsByType(sourceEntry, category);
        if (rels.length === 0) return [];
        const href = this.runner.resolveEntityHref(rels, category, sourceEntry.id) ?? this.runner.resolveUrlHref(sourceEntry.id);
        return [
          {
            elementId: `mb-indicator-${videoId}-${category}`,
            category,
            href,
            labelKey: category === "recording" ? "labelRecording" : "labelRelease",
            tooltipKey: category === "recording" ? "tooltipRecording" : "tooltipRelease"
          }
        ];
      });
      return { mode: links.length >= 2 ? "dropdown" : "single", links };
    }
    buildArtist(artistMbid, authorUrlId, artistCount) {
      if (!artistMbid) return null;
      const href = artistCount > 1 && authorUrlId ? this.runner.resolveUrlHref(authorUrlId) : this.runner.resolveMbidHref("artist", artistMbid);
      return { href, iconSrc: this.iconSrc };
    }
    buildAction(videoId, showRecording, showRelease) {
      const buttons = [];
      if (showRecording) {
        buttons.push({ id: `mb-add-rec-${videoId}`, type: "recording", labelKey: "addRecording" });
      }
      if (showRelease) {
        buttons.push({ id: `mb-add-rel-${videoId}`, type: "release", labelKey: "addRelease" });
      }
      return { showRecording, showRelease, buttons };
    }
  }
  class NiconicoRenderer {
    constructor(selectors) {
      this.selectors = selectors;
    }
    reset() {
      document.querySelector(".NicoToMbMasterContainer")?.remove();
      document.getElementById("mb-open-link-container")?.remove();
      document.getElementById("mb-api-error")?.remove();
      document.querySelectorAll(".mb-status-indicator").forEach((el) => el.remove());
    }
    renderApiError() {
      const master = document.querySelector(".NicoToMbMasterContainer");
      if (!master) return;
      document.getElementById("mb-api-error")?.remove();
      const msg = document.createElement("span");
      msg.id = "mb-api-error";
      msg.className = "mb-error-msg";
      msg.textContent = i18n.t("apiError");
      master.appendChild(msg);
      syncMBButtons(".mb-transmit-btn", false, i18n.t("loadingApi"));
    }
    renderVideoIndicators(vm) {
      if (vm.links.length === 0) return;
      if (document.getElementById("mb-open-link-container")) return;
      const master = document.querySelector(".NicoToMbMasterContainer");
      if (!master) return;
      const container = document.createElement("span");
      container.id = "mb-open-link-container";
      if (vm.mode === "dropdown") {
        this.appendDropdownLinks(container, vm.links);
      } else {
        this.appendSingleLink(container, vm.links[0]);
      }
      master.appendChild(container);
    }
    appendDropdownLinks(container, links) {
      const subLinks = document.createElement("span");
      subLinks.className = "mb-sub-links";
      subLinks.setAttribute("data-open", "false");
      links.forEach((link) => subLinks.appendChild(this.createOpenLink(link)));
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "mb-open-link";
      toggleBtn.textContent = `↗ ${i18n.t("openOnMb")}`;
      toggleBtn.title = `${i18n.t("tooltipRecording")} / ${i18n.t("tooltipRelease")}`;
      toggleBtn.onclick = () => {
        const isOpen = subLinks.getAttribute("data-open") === "true";
        subLinks.setAttribute("data-open", isOpen ? "false" : "true");
      };
      container.style.cssText = "display:inline-flex;align-items:center;gap:8px;position:relative;";
      container.appendChild(toggleBtn);
      container.appendChild(subLinks);
    }
    appendSingleLink(container, link) {
      const a = this.createOpenLink(link);
      a.classList.add("mb-status-indicator");
      a.textContent = `↗ ${i18n.t("openOnMb")}`;
      container.appendChild(a);
    }
    createOpenLink(link) {
      const a = document.createElement("a");
      a.id = link.elementId;
      a.className = "mb-open-link";
      a.target = "_blank";
      a.href = link.href;
      a.title = i18n.t(link.tooltipKey);
      a.textContent = i18n.t(link.labelKey);
      return a;
    }
    renderArtistIndicator(vm) {
      if (!vm || document.getElementById("mb-artist-link")) return;
      const avatarLink = document.querySelector(this.selectors.avatarLink);
      if (!avatarLink) return;
      const anchor = createMBIconLink({
        id: "mb-artist-link",
        href: vm.href,
        iconSrc: vm.iconSrc,
        tooltip: i18n.t("tooltipArtist"),
        className: "mb-status-indicator",
        iconClassName: "mb-status-icon mb-artist-icon"
      });
      avatarLink.insertAdjacentElement("beforebegin", anchor);
    }
    renderActionControls(vm) {
      const anchorPoint = document.querySelector(this.selectors.tagAnchor)?.closest(".pos_relative.d_flex");
      if (!anchorPoint) return;
      let master = document.querySelector(".NicoToMbMasterContainer");
      if (!master) {
        master = document.createElement("div");
        master.className = "NicoToMbMasterContainer";
        anchorPoint.insertAdjacentElement("afterend", master);
      }
      for (const btn of vm.buttons) {
        if (document.getElementById(btn.id)) continue;
        master.appendChild(
          createMBButton({
            id: btn.id,
            className: "mb-transmit-btn",
            label: i18n.t(btn.labelKey),
            loadingLabel: i18n.t("loadingApi"),
            pending: true
          })
        );
        document.getElementById(btn.id)?.setAttribute("data-mb-type", btn.type);
      }
    }
  }
  class NiconicoTransmitter {
    constructor(autoCopyMbid) {
      this.autoCopyMbid = autoCopyMbid;
    }
    transmit(targetType, data, mbid) {
      if (this.autoCopyMbid) {
        GM_setClipboard(mbid ?? data.author, "text");
      }
      const isRec = targetType === "recording";
      const editNote = `${data.sourceUrl}
---
${GM_info.script.name}/${GM_info.script.version}`;
      const fields = isRec ? {
        "edit-recording.name": data.title,
        "edit-recording.artist_credit.names.0.name": data.author,
        "edit-recording.artist_credit.names.0.mbid": mbid ?? "",
        "edit-recording.length": data.runtime,
        "edit-recording.video": "1",
        "edit-recording.url.0.text": data.sourceUrl,
        "edit-recording.url.0.link_type_id": "268",
        "edit-recording.edit_note": editNote,
        artist: mbid ?? ""
      } : {
        name: data.title,
        packaging: "none",
        "artist_credit.names.0.name": data.author,
        "artist_credit.names.0.mbid": mbid ?? "",
        "urls.0.url": data.sourceUrl,
        "urls.0.link_type": "85",
        "mediums.0.format": "Digital Media",
        "mediums.0.track.0.name": data.title,
        "mediums.0.track.0.artist_credit.names.0.name": data.author,
        "mediums.0.track.0.artist_credit.names.0.mbid": mbid ?? "",
        "mediums.0.track.0.length": data.runtime,
        "events.0.date.year": data.released.year,
        "events.0.date.month": data.released.month,
        "events.0.date.day": data.released.day,
        "events.0.country": "XW",
        edit_note: editNote
      };
      submitMBForm(createMBForm(isRec ? "/recording/create" : "/release/add", fields, { method: isRec ? "GET" : "POST" }));
    }
  }
  class NicoMusicBrainzBridge {
    selectors = {
      videoTitle: "h1.fs_xl.fw_bold, h1.VideoTitle",
      tagAnchor: 'a[data-anchor-area="tags"]',
      avatarLink: 'a[href^="/user/"]:has(img), a.VideoOwnerInfo-pageLink:has(img)'
    };
    settings = {
      showRecording: GM_getValue("showRecording", true),
      showRelease: GM_getValue("showRelease", false),
      autoCopyMbid: GM_getValue("autoCopyMbid", false)
    };
    requestToken = { current: Symbol("init") };
    runner;
    scraper;
    viewModel;
    renderer;
    transmitter;
    activeSession = { videoId: null, videoDetails: null };
    get videoId() {
      return this.activeSession.videoId;
    }
    constructor() {
      this.runner = createImporterRunner({
        appName: GM_info.script.name,
        appVersion: GM_info.script.version,
        appContact: GM_info.script.namespace
      });
      this.scraper = new NiconicoScraper();
      this.viewModel = new NiconicoViewModel(this.runner, mbicon);
      this.renderer = new NiconicoRenderer(this.selectors);
      this.transmitter = new NiconicoTransmitter(this.settings.autoCopyMbid);
      this.init();
    }
    init() {
      this.registerSettingsMenu();
      this.applyGlobalStyles();
      this.observeNavigation();
    }
importer = {
      siteId: "niconico",
      extractContext: () => {
        if (!location.pathname.startsWith("/watch/")) return null;
        const videoId = location.pathname.split("/")[2];
        if (!videoId) return null;
        try {
          const details = this.scraper.analyze(videoId);
          if (!details) return null;
          console.info(`[MB:${this.importer.siteId}] importer start`, location.pathname);
          return { videoId, details };
        } catch {
          return null;
        }
      },
      getQueries: (ctx) => {
        const queries = [{ key: "source", url: ctx.details.sourceUrl, includes: ["recording-rels", "release-rels"] }];
        if (ctx.details.authorUrl) {
          queries.push({ key: "artist", url: ctx.details.authorUrl, includes: ["artist-rels"] });
        }
        return queries;
      }
    };
attachUI(ctx) {
      this.renderer.renderActionControls(this.viewModel.buildAction(ctx.videoId, this.settings.showRecording, this.settings.showRelease));
    }
    updateUI(ctx, entries) {
      const sourceEntry = entries["source"] ?? null;
      const authorEntry = entries["artist"] ?? null;
      const artists = getRelationsByType(authorEntry, "artist");
      const artistMbid = artists[0]?.artist?.id ?? null;
      const authorUrlId = authorEntry?.id ?? null;
      this.renderer.renderArtistIndicator(this.viewModel.buildArtist(artistMbid, authorUrlId, artists.length));
      if (document.querySelector(".NicoToMbMasterContainer")) {
        this.renderer.renderVideoIndicators(this.viewModel.buildVideoIndicators(sourceEntry, ctx.videoId));
      }
      document.querySelectorAll(".mb-transmit-btn[data-mb-type]").forEach((btn) => {
        const type = btn.getAttribute("data-mb-type");
        if (!type) return;
        btn.onclick = () => this.transmitter.transmit(type, ctx.details, artistMbid);
      });
    }
    runImporter() {
      void this.runner.run(
        this.importer,
        this.requestToken,
        (ctx) => this.attachUI(ctx),
        (ctx, entries) => this.updateUI(ctx, entries),
        (pending) => syncMBButtons(".mb-transmit-btn", pending, i18n.t("loadingApi")),
        void 0,
        () => this.renderer.renderApiError()
      );
    }
registerSettingsMenu() {
      const toggleEmoji = (val) => val ? "✅ ON" : "❌ OFF";
      const save = (key, val) => {
        GM_setValue(key, val);
        location.reload();
      };
      GM_registerMenuCommand(`${i18n.t("menuRecording")}: ${toggleEmoji(this.settings.showRecording)}`, () => save("showRecording", !this.settings.showRecording));
      GM_registerMenuCommand(`${i18n.t("menuRelease")}:   ${toggleEmoji(this.settings.showRelease)}`, () => save("showRelease", !this.settings.showRelease));
      GM_registerMenuCommand(`${i18n.t("menuAutoCopy")}: ${toggleEmoji(this.settings.autoCopyMbid)}`, () => save("autoCopyMbid", !this.settings.autoCopyMbid));
    }
applyGlobalStyles() {
      const { errorColor } = MB_DESIGN;
      GM_addStyle(`
            ${mbButtonBaseStyle("mb-transmit-btn", {
      height: "36px",
      padding: "0 16px",
      borderRadius: "18px",
      fontSize: "14px",
      fontWeight: "bold"
    })}
            .mb-heading-active {
                display: inline-flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
            }
            .NicoToMbMasterContainer {
                display: flex !important;
                flex-direction: row !important;
                gap: 8px !important;
                margin-top: 8px !important;
                align-items: center !important;
            }
            .mb-error-msg {
                font-size: 12px !important;
                color: ${errorColor} !important;
                font-weight: bold !important;
                margin-left: 8px !important;
                animation: mb-fade-in 0.3s ease-out;
            }
            @keyframes mb-fade-in {
                from { opacity: 0; transform: translateX(-5px); }
                to   { opacity: 1; transform: translateX(0); }
            }
            .mb-status-indicator {
                display: inline-flex !important;
                align-items: center !important;
                text-decoration: none !important;
                flex-shrink: 0 !important;
            }
            .mb-status-icon {
                width: 22px !important;
                height: 22px !important;
                vertical-align: middle !important;
                transition: transform 0.2s;
                object-fit: contain !important;
            }
            .mb-status-icon:hover { transform: scale(1.1); }
            .mb-artist-icon {
                width: 20px !important;
                height: 20px !important;
                min-width: 20px !important;
                min-height: 20px !important;
                margin-right: 4px !important;
            }
            .NicoToMbSectionContainer {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 8px !important;
            }
            .mb-open-link {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 3px !important;
                font-size: 12px !important;
                color: #C63A84 !important;
                font-weight: 500 !important;
                text-decoration: none !important;
                padding: 0 12px !important;
                height: 36px !important;
                box-sizing: border-box !important;
                border: 1px solid #C63A84 !important;
                border-radius: 18px !important;
                transition: background 0.2s ease !important;
                white-space: nowrap !important;
                cursor: pointer !important;
            }
            .mb-open-link:hover {
                background: #F8E3EF !important;
            }
            .mb-sub-links {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
                position: absolute !important;
                top: calc(100% + 6px) !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                translate: 0 -6px !important;
                z-index: 9999 !important;
                min-width: max-content !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 0.18s ease, translate 0.18s ease !important;
            }
            .mb-sub-links[data-open="true"] {
                opacity: 1 !important;
                translate: 0 0 !important;
                pointer-events: auto !important;
            }
            .mb-sub-links .mb-open-link {
                border-radius: 8px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .mb-sub-links[data-open="true"] .mb-open-link {
                background: #fff !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
            }
            .mb-sub-links[data-open="true"] .mb-open-link:hover {
                background: #F8E3EF !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            .mb-sub-links[data-open="true"] .mb-open-link:hover {
                background: #F8E3EF !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
        `);
    }
initSession() {
      if (!location.pathname.startsWith("/watch/")) return;
      const videoId = location.pathname.split("/")[2];
      if (this.activeSession.videoId === videoId) return;
      this.renderer.reset();
      this.requestToken.current = Symbol();
      this.activeSession = { videoId, videoDetails: null };
    }
    startWatching() {
      if (!location.pathname.startsWith("/watch/")) return;
      this.initSession();
      const { videoTitle, tagAnchor } = this.selectors;
      const hasTitle = () => !!document.querySelector(videoTitle);
      const hasTags = () => !!document.querySelector(tagAnchor);
      const hasLdJson = () => !!this.videoId && this.scraper.hasVideoLdJson(this.videoId);
      const tryRun = () => {
        if (!hasTitle() || !hasTags() || !hasLdJson()) return false;
        this.runImporter();
        return true;
      };
      if (tryRun()) return;
      const observer = new MutationObserver(() => {
        if (!location.pathname.startsWith("/watch/")) {
          observer.disconnect();
          return;
        }
        if (tryRun()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    observeNavigation() {
      const patch = (type) => {
        const orig = history[type].bind(history);
        history[type] = (...args) => {
          orig(...args);
          this.startWatching();
        };
      };
      patch("pushState");
      patch("replaceState");
      window.addEventListener("popstate", () => this.startWatching());
      this.startWatching();
    }
  }
  new NicoMusicBrainzBridge();

})();