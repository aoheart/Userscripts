// ==UserScript==
// @name            Import AWA to MusicBrainz
// @namespace       https://github.com/aoheart/Userscripts
// @version         2026.04.03
// @author          aoheart
// @description     Helps importing music metadata from AWA into MusicBrainz.
// @description:ja  AWAからMusicBrainzへのインポートを支援する機能を追加します。
// @license         MIT
// @icon            data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNyAzMCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlYjc0M2I7fS5jbHMtMntmaWxsOiNiYTQ3OGY7fS5jbHMtM3tmaWxsOiNmZmZlZGI7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMy45NCAxIDEzLjk0IDI5IDI1LjkgMjIgMjUuOSA4IDEzLjk0IDEiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMTMuMDYgMSAxLjEgOCAxLjEgMjIgMTMuMDYgMjkgMTMuMDYgMSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjA2LDExLjIxLDcuNTIsMTQuNDJWMTIuMDhsNS41NC0zLjJWNC41TDYuNjQsOC4zOGgwbC0uMDYsMCwwLDAsMCwwLDAsMCwwLC4wNXMwLDAsMCwuMDUsMCwwLDAsMGEuMTQuMTQsMCwwLDAsMCwuMDYuNDMuNDMsMCwwLDAsMCwuMDV2MTBhMi42MSwyLjYxLDAsMCwwLTEuNTYuM0ExLjksMS45LDAsMCwwLDQsMjEuNTNhMS44NiwxLjg2LDAsMCwwLDIuNTcuMTgsMi40MywyLjQzLDAsMCwwLDEtMS40NmMwLS4wNiwwLTQuMzcsMC00LjM3bDUuNTQtMy4yMVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0yMy4zNSwxNy4zNmExLjk0LDEuOTQsMCwwLDAtMS42Ni0uOTIsMS45LDEuOSwwLDAsMC0uNTguMDksNS4xNyw1LjE3LDAsMCwwLTIuNS0xLjY1LDguNjEsOC42MSwwLDAsMCwxLjcyLTEuNzksMi4wNiwyLjA2LDAsMCwwLDEuNS0uMjQsMiwyLDAsMSwwLTIuNzItLjYybC4xMi4xN2E2Ljg1LDYuODUsMCwwLDEtMi43NywyLjI3aDBhNS4zOCw1LjM4LDAsMCwxLTIuNTEuNjJ2MS40NmE2LjM2LDYuMzYsMCwwLDAsMi45Mi0uODUsNC4zMyw0LjMzLDAsMCwxLDMuMiwxLjM5LDIsMiwwLDAsMCwyLjY4LDIuNzksMiwyLDAsMCwwLC42MS0yLjcyWm0tMy02LjgzYS43NS43NSwwLDAsMSwuNDEtLjEyLjc2Ljc2LDAsMCwxLC40MSwxLjQxLjczLjczLDAsMCwxLS40MS4xMi43Mi43MiwwLDAsMS0uNC0uMTIuNjkuNjksMCwwLDEtLjI0LS4yNEEuNzYuNzYsMCwwLDEsMjAuMzcsMTAuNTNabTIuMDYsOGEuNzcuNzcsMCwwLDEtLjc0LjYuNzcuNzcsMCwwLDEtLjQ1LTEuMzlsMCwwYS43Ny43NywwLDAsMSwxLC4yNEEuNzIuNzIsMCwwLDEsMjIuNDMsMTguNThaIi8+PC9zdmc+
// @supportURL      https://github.com/aoheart/Userscripts/issues
// @downloadURL     https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-awa-to-musicbrainz.user.js
// @updateURL       https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-awa-to-musicbrainz.user.js
// @match           *://s.awa.fm/*
// @connect         musicbrainz.org
// @grant           GM_addStyle
// @grant           GM_info
// @grant           GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const mbicon = "data:image/svg+xml,%3csvg%20id='Layer_1'%20data-name='Layer%201'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2027%2030'%3e%3cdefs%3e%3cstyle%3e.cls-1{fill:%23ba478f;}.cls-2{fill:%23eb743b;}%3c/style%3e%3c/defs%3e%3cpolygon%20class='cls-1'%20points='13%201%201%208%201%2022%2013%2029%2013%201'/%3e%3cpolygon%20class='cls-2'%20points='14%201%2026%208%2026%2022%2014%2029%2014%201'/%3e%3c/svg%3e";
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
  const i18n = createI18n({
    ja: {
      importLabel: "Import to MusicBrainz",
      loadingApi: "MusicBrainzに照会中...",
      apiError: "MB APIエラー",
      tooltipArtist: "MusicBrainz: アーティスト登録済み",
      tooltipRelease: "MusicBrainz: リリース登録済み"
    },
    en: {
      importLabel: "Import to MusicBrainz",
      loadingApi: "Querying MusicBrainz...",
      apiError: "MB query failed",
      tooltipArtist: "MusicBrainz: Artist registered",
      tooltipRelease: "MusicBrainz: Release registered"
    }
  });
  class AWAScraper {
    extract() {
      try {
        const nextDataTag = document.getElementById("__NEXT_DATA__");
        if (!nextDataTag) return null;
        const nextData = JSON.parse(nextDataTag.textContent ?? "");
        const albumStore = nextData?.props?.pageProps?.dehydrated?.context?.dispatcher?.stores?.AlbumStore;
        const urlId = window.location.pathname.split("/").pop() ?? "";
        const album = albumStore?.album?.map?.[urlId];
        if (!album?.tracks) return null;
        const relDate = album.releasedAt ? new Date(album.releasedAt * 1e3) : null;
        return {
          id: urlId,
          title: album.name,
          artist: album.artist?.name ?? "",
          year: relDate ? relDate.getUTCFullYear() : "",
          month: relDate ? relDate.getUTCMonth() + 1 : "",
          day: relDate ? relDate.getUTCDate() : "",
          tracks: album.tracks.map(
(t) => ({
              title: t.name ?? "",
              artist: t.artistName ?? album.artist?.name ?? "",
              length: Math.round((t.playbackTime ?? 0) * 1e3)
            })
          ),
          canonicalUrl: window.location.origin + window.location.pathname,
          artistUrl: album.artist?.id ? `${window.location.origin}/artist/${album.artist.id}` : null
        };
      } catch {
        return null;
      }
    }
  }
  class AWARenderer {
    constructor(artistLinkSelector, runner, iconSrc) {
      this.artistLinkSelector = artistLinkSelector;
      this.runner = runner;
      this.iconSrc = iconSrc;
    }
    reset() {
      document.getElementById("mb-api-error")?.remove();
    }
    renderApiError() {
      const row = document.getElementById("mb-action-row");
      if (!row) return;
      document.getElementById("mb-api-error")?.remove();
      const msg = document.createElement("span");
      msg.id = "mb-api-error";
      msg.className = "mb-error-msg";
      msg.textContent = i18n.t("apiError");
      row.appendChild(msg);
      syncMBButtons("#mb-import-btn", false, i18n.t("loadingApi"));
    }
    getOrCreateActionRow() {
      const existing = document.getElementById("mb-action-row");
      if (existing) return existing;
      const artistLink = document.querySelector(this.artistLinkSelector);
      const container = artistLink?.closest("div")?.parentElement;
      if (!container) return null;
      const row = document.createElement("div");
      row.id = "mb-action-row";
      row.className = "mb-action-row";
      container.appendChild(row);
      return row;
    }
    renderActionButton(label, loadingLabel, onClick) {
      const row = this.getOrCreateActionRow();
      if (!row || document.getElementById("mb-import-btn")) return;
      row.appendChild(
        createMBButton({
          id: "mb-import-btn",
          className: "mb-import-button",
          label,
          loadingLabel,
          pending: true,
          onClick
        })
      );
    }
    renderArtistIcon(href) {
      if (document.getElementById("mb-artist-icon")) return;
      const artistLink = document.querySelector('a[href^="/artist/"]');
      if (!artistLink) return;
      const anchor = createMBIconLink({
        id: "mb-artist-icon",
        href,
        iconSrc: this.iconSrc,
        tooltip: i18n.t("tooltipArtist"),
        className: "mb-exist-icon-link",
        iconClassName: "mb-icon-img"
      });
      artistLink.insertAdjacentElement("afterend", anchor);
    }
    renderTitleIcon(urlId, relations, retryCount = 0) {
      const h1 = document.querySelector("h1");
      if (!h1) {
        if (retryCount < 15) {
          setTimeout(() => this.renderTitleIcon(urlId, relations, retryCount + 1), 300);
        }
        return;
      }
      if (document.getElementById("mb-release-exist-icon")) return;
      const href = this.runner.resolveEntityHref(relations, "release", urlId) ?? this.runner.resolveUrlHref(urlId);
      const link = createMBIconLink({
        id: "mb-release-exist-icon",
        href,
        iconSrc: this.iconSrc,
        tooltip: i18n.t("tooltipRelease"),
        fallbackText: "(Release✓)",
        className: "mb-exist-icon-link",
        iconClassName: "mb-icon-img"
      });
      h1.prepend(link);
    }
  }
  class AWATransmitter {
    scriptVer;
    constructor() {
      this.scriptVer = `${GM_info.script.name} (v${GM_info.script.version})`;
    }
    transmit(data) {
      const params = {
        name: data.title,
        "artist_credit.names.0.name": data.artist,
        "date.year": data.year,
        "date.month": data.month,
        "date.day": data.day,
        packaging: "none",
        "mediums.0.format": "Digital Media",
        "urls.0.url": data.canonicalUrl,
        "urls.0.link_type": "980",
        edit_note: `Imported from AWA: ${data.canonicalUrl}
---
${this.scriptVer}`
      };
      data.tracks.forEach((track, index) => {
        params[`mediums.0.track.${index}.name`] = track.title;
        params[`mediums.0.track.${index}.length`] = track.length;
        params[`mediums.0.track.${index}.artist_credit.names.0.name`] = track.artist;
      });
      submitMBForm(createMBForm("/release/add", params));
    }
  }
  class AWAMusicBrainzBridge {
    selectors = {
      artistLink: 'a[href^="/artist/"]'
    };
    runner;
    scraper;
    renderer;
    transmitter;
    requestToken = { current: Symbol("init") };
    lastProcessedId = null;
    constructor() {
      this.runner = createImporterRunner({
        appName: GM_info.script.name,
        appVersion: GM_info.script.version,
        appContact: GM_info.script.namespace
      });
      this.scraper = new AWAScraper();
      this.renderer = new AWARenderer(this.selectors.artistLink, this.runner, mbicon);
      this.transmitter = new AWATransmitter();
      this.applyGlobalStyles();
      this.observeNavigation();
    }
importer = {
      siteId: "awa",
      extractContext: () => {
        if (!location.pathname.includes("/album/")) return null;
        const albumId = window.location.pathname.split("/").pop() ?? "";
        if (this.lastProcessedId === albumId && document.getElementById("mb-import-btn")) return null;
        return this.scraper.extract();
      },
      getQueries: (ctx) => {
        const queries = [{ key: "source", url: ctx.canonicalUrl, includes: ["release-rels"] }];
        if (ctx.artistUrl) {
          queries.push({ key: "artist", url: ctx.artistUrl, includes: ["artist-rels"] });
        }
        return queries;
      }
    };
attachUI(ctx) {
      this.lastProcessedId = ctx.id;
      this.renderer.reset();
      this.renderer.renderActionButton(i18n.t("importLabel"), i18n.t("loadingApi"), () => this.transmitter.transmit(ctx));
    }
    updateUI(_ctx, entries) {
      const sourceEntry = entries["source"] ?? null;
      const authorEntry = entries["artist"] ?? null;
      if (sourceEntry) {
        const rels = sourceEntry.relations.filter((r) => r["target-type"] === "release");
        if (rels.length > 0) this.renderer.renderTitleIcon(sourceEntry.id, rels);
      }
      if (authorEntry) {
        const artistRels = authorEntry.relations.filter((r) => r["target-type"] === "artist");
        const artistMbid = artistRels[0]?.artist?.id ?? null;
        if (artistMbid) {
          const href = artistRels.length > 1 ? this.runner.resolveUrlHref(authorEntry.id) : this.runner.resolveMbidHref("artist", artistMbid);
          this.renderer.renderArtistIcon(href);
        }
      }
    }
runImporter() {
      void this.runner.run(
        this.importer,
        this.requestToken,
        (ctx) => this.attachUI(ctx),
        (ctx, entries) => this.updateUI(ctx, entries),
        (pending) => syncMBButtons("#mb-import-btn", pending, i18n.t("loadingApi")),
        void 0,
        () => {
          this.renderer.renderApiError();
        }
      );
    }
applyGlobalStyles() {
      GM_addStyle(`
      ${mbButtonBaseStyle("mb-import-button", {
      height: "32px",
      padding: "0 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600"
    })}
      .mb-exist-icon-link {
          margin-right: 8px !important;
          display: inline-flex !important;
          align-items: center !important;
          text-decoration: none !important;
          vertical-align: middle !important;
      }
      .mb-icon-img {
          width: 20px !important;
          height: 20px !important;
          vertical-align: middle !important;
      }
      .mb-action-row {
          display: flex !important;
          align-items: center !important;
          margin-top: 8px !important;
          gap: 8px !important;
      }
      .mb-error-msg {
          font-size: 12px !important;
          color: ${MB_DESIGN.errorColor} !important;
          font-weight: bold !important;
      }
    `);
    }
observeNavigation() {
      const observer = new MutationObserver(() => this.runImporter());
      observer.observe(document.body, { childList: true, subtree: true });
      this.runImporter();
    }
  }
  new AWAMusicBrainzBridge();

})();