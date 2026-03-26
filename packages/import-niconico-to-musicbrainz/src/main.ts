import mbicon from "@scripts/common/assets/musicbrainz-icon.svg?url";
import { createI18n } from "@scripts/common/i18n";
import { createMBForm, submitMBForm } from "@scripts/common/mb-formsubmit";
import { MB_DESIGN, mbButtonBaseStyle, createMBButton, createMBIconLink, syncMBButtons } from "@scripts/common/mb-ui-utils";
import { MBUrlEntry, getRelationsByType, MBQuery, SiteImporter, ImporterRunner, createImporterRunner } from "@scripts/common/mb-importer-core";

/* =========================================================
 *  型定義
 * ========================================================= */

interface VideoDetails {
  title: string;
  author: string;
  authorUrl: string;
  released: { year: string; month: string; day: string };
  runtime: number | null;
  sourceUrl: string;
}

interface ActiveSession {
  videoId: string | null;
  videoDetails: VideoDetails | null;
}

interface VideoContext {
  videoId: string;
  details: VideoDetails;
}

interface VideoIndicatorsViewModel {
  mode: "single" | "dropdown";
  links: Array<{
    elementId: string;
    category: "recording" | "release";
    href: string;
    labelKey: "labelRecording" | "labelRelease";
    tooltipKey: "tooltipRecording" | "tooltipRelease";
  }>;
}

interface ArtistViewModel {
  href: string;
  iconSrc: string;
}

interface ActionViewModel {
  showRecording: boolean;
  showRelease: boolean;
  buttons: Array<{
    id: string;
    type: "recording" | "release";
    labelKey: "addRecording" | "addRelease";
  }>;
}

/* =========================================================
 *  i18n
 * ========================================================= */
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
    openOnMb: "MBで開く",
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
    openOnMb: "Open on MB",
  },
});

/* =========================================================
 *  SCRAPER
 *  LD+JSON の解析に特化する。
 * ========================================================= */
class NiconicoScraper {
  analyze(videoId: string): VideoDetails | null {
    try {
      const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]:not([data-mb-parsed])'));

      let videoObject: Record<string, unknown> | null = null;

      for (const s of scripts) {
        s.dataset.mbParsed = "1";
        try {
          const obj = JSON.parse(s.textContent ?? "") as Record<string, unknown>;
          if (obj["@type"] === "VideoObject" && typeof obj["url"] === "string" && (obj["url"] as string).includes(videoId)) {
            videoObject = obj;
          }
        } catch {
          // malformed JSON は無視
        }
      }

      if (!videoObject || !videoObject["name"]) return null;

      const dateRaw = typeof videoObject["uploadDate"] === "string" ? (videoObject["uploadDate"] as string).split("T")[0].split("-") : ["", "", ""];

      const durMatch =
        typeof videoObject["duration"] === "string"
          ? (videoObject["duration"] as string).match(
              // eslint-disable-next-line security/detect-unsafe-regex
              /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?/,
            )
          : null;

      const author = videoObject["author"] as Record<string, string> | undefined;
      const authorUrl = typeof author?.["url"] === "string" ? author["url"].split("?")[0] : "";

      return {
        title: videoObject["name"] as string,
        author: author?.["name"] ?? "",
        authorUrl,
        released: {
          year: dateRaw[0] ?? "",
          month: dateRaw[1] ?? "",
          day: dateRaw[2] ?? "",
        },
        runtime: durMatch ? Math.round((parseFloat(durMatch[1] ?? "0") * 3600 + parseFloat(durMatch[2] ?? "0") * 60 + parseFloat(durMatch[3] ?? "0")) * 1000) : null,
        sourceUrl: window.location.href.split("?")[0],
      };
    } catch {
      return null;
    }
  }

  hasVideoLdJson(videoId: string): boolean {
    return Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')).some((s) => (s.textContent ?? "").includes(videoId));
  }
}

/* =========================================================
 *  VIEW MODEL
 *  データから表示用オブジェクトを生成する。
 * ========================================================= */
class NiconicoViewModel {
  constructor(
    private readonly runner: ImporterRunner,
    private readonly iconSrc: string,
  ) {}

  buildVideoIndicators(sourceEntry: MBUrlEntry | null, videoId: string): VideoIndicatorsViewModel {
    if (!sourceEntry) return { mode: "single", links: [] };

    const links = (["recording", "release"] as const).flatMap((category) => {
      const rels = getRelationsByType(sourceEntry, category);
      if (rels.length === 0) return [];

      const href = this.runner.resolveEntityHref(rels, category, sourceEntry.id) ?? this.runner.resolveUrlHref(sourceEntry.id);

      return [
        {
          elementId: `mb-indicator-${videoId}-${category}`,
          category,
          href,
          labelKey: (category === "recording" ? "labelRecording" : "labelRelease") as "labelRecording" | "labelRelease",
          tooltipKey: (category === "recording" ? "tooltipRecording" : "tooltipRelease") as "tooltipRecording" | "tooltipRelease",
        },
      ];
    });

    return { mode: links.length >= 2 ? "dropdown" : "single", links };
  }

  buildArtist(artistMbid: string | null, authorUrlId: string | null, artistCount: number): ArtistViewModel | null {
    if (!artistMbid) return null;

    const href = artistCount > 1 && authorUrlId ? this.runner.resolveUrlHref(authorUrlId) : this.runner.resolveMbidHref("artist", artistMbid);

    return { href, iconSrc: this.iconSrc };
  }

  buildAction(videoId: string, showRecording: boolean, showRelease: boolean): ActionViewModel {
    const buttons: ActionViewModel["buttons"] = [];

    if (showRecording) {
      buttons.push({ id: `mb-add-rec-${videoId}`, type: "recording", labelKey: "addRecording" });
    }
    if (showRelease) {
      buttons.push({ id: `mb-add-rel-${videoId}`, type: "release", labelKey: "addRelease" });
    }

    return { showRecording, showRelease, buttons };
  }
}

/* =========================================================
 *  RENDERER
 *  ViewModel を受け取り DOM を操作する。
 * ========================================================= */
class NiconicoRenderer {
  constructor(private readonly selectors: { tagAnchor: string; avatarLink: string }) {}

  reset(): void {
    document.querySelector(".NicoToMbMasterContainer")?.remove();
    document.getElementById("mb-open-link-container")?.remove();
    document.getElementById("mb-api-error")?.remove();
    document.querySelectorAll(".mb-status-indicator").forEach((el) => el.remove());
  }

  renderApiError(): void {
    const master = document.querySelector<HTMLElement>(".NicoToMbMasterContainer");
    if (!master) return;

    document.getElementById("mb-api-error")?.remove();

    const msg = document.createElement("span");
    msg.id = "mb-api-error";
    msg.className = "mb-error-msg";
    msg.textContent = i18n.t("apiError");
    master.appendChild(msg);

    syncMBButtons(".mb-transmit-btn", false, i18n.t("loadingApi"));
  }

  renderVideoIndicators(vm: VideoIndicatorsViewModel): void {
    if (vm.links.length === 0) return;
    if (document.getElementById("mb-open-link-container")) return;

    const master = document.querySelector<HTMLElement>(".NicoToMbMasterContainer");
    if (!master) return;

    const container = document.createElement("span");
    container.id = "mb-open-link-container";

    if (vm.mode === "dropdown") {
      this.appendDropdownLinks(container, vm.links);
    } else {
      this.appendSingleLink(container, vm.links[0]!);
    }

    master.appendChild(container);
  }

  private appendDropdownLinks(container: HTMLElement, links: VideoIndicatorsViewModel["links"]): void {
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

  private appendSingleLink(container: HTMLElement, link: VideoIndicatorsViewModel["links"][number]): void {
    const a = this.createOpenLink(link);
    a.classList.add("mb-status-indicator");
    a.textContent = `↗ ${i18n.t("openOnMb")}`;
    container.appendChild(a);
  }

  private createOpenLink(link: VideoIndicatorsViewModel["links"][number]): HTMLAnchorElement {
    const a = document.createElement("a");
    a.id = link.elementId;
    a.className = "mb-open-link";
    a.target = "_blank";
    a.href = link.href;
    a.title = i18n.t(link.tooltipKey);
    a.textContent = i18n.t(link.labelKey);
    return a;
  }

  renderArtistIndicator(vm: ArtistViewModel | null): void {
    if (!vm || document.getElementById("mb-artist-link")) return;

    const avatarLink = document.querySelector<HTMLElement>(this.selectors.avatarLink);
    if (!avatarLink) return;

    const anchor = createMBIconLink({
      id: "mb-artist-link",
      href: vm.href,
      iconSrc: vm.iconSrc,
      tooltip: i18n.t("tooltipArtist"),
      className: "mb-status-indicator",
      iconClassName: "mb-status-icon mb-artist-icon",
    });

    avatarLink.insertAdjacentElement("beforebegin", anchor);
  }

  renderActionControls(vm: ActionViewModel): void {
    const anchorPoint = document.querySelector(this.selectors.tagAnchor)?.closest<HTMLElement>(".pos_relative.d_flex");
    if (!anchorPoint) return;

    let master = document.querySelector<HTMLElement>(".NicoToMbMasterContainer");
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
          pending: true,
        }),
      );
      document.getElementById(btn.id)?.setAttribute("data-mb-type", btn.type);
    }
  }
}

/* =========================================================
 *  TRANSMITTER
 *  MusicBrainz へのフォーム送信に特化する。
 * ========================================================= */
class NiconicoTransmitter {
  constructor(private readonly autoCopyMbid: boolean) {}

  transmit(targetType: "recording" | "release", data: VideoDetails, mbid: string | null): void {
    if (this.autoCopyMbid) {
      GM_setClipboard(mbid ?? data.author, "text");
    }

    const isRec = targetType === "recording";
    const editNote = `${data.sourceUrl}\n---\n${GM_info.script.name}/${GM_info.script.version}`;

    const fields: Record<string, string | number | null | undefined> = isRec
      ? {
          "edit-recording.name": data.title,
          "edit-recording.artist_credit.names.0.name": data.author,
          "edit-recording.artist_credit.names.0.mbid": mbid ?? "",
          "edit-recording.length": data.runtime,
          "edit-recording.video": "1",
          "edit-recording.url.0.text": data.sourceUrl,
          "edit-recording.url.0.link_type_id": "268",
          "edit-recording.edit_note": editNote,
          artist: mbid ?? "",
        }
      : {
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
          edit_note: editNote,
        };

    submitMBForm(createMBForm(isRec ? "/recording/create" : "/release/add", fields, { method: isRec ? "GET" : "POST" }));
  }
}

/* =========================================================
 *  CONTROLLER
 *  各クラスを組み合わせて制御フローを管理する。
 * ========================================================= */
class NicoMusicBrainzBridge {
  private readonly selectors = {
    videoTitle: "h1.fs_xl.fw_bold, h1.VideoTitle",
    tagAnchor: 'a[data-anchor-area="tags"]',
    avatarLink: 'a[href^="/user/"]:has(img), a.VideoOwnerInfo-pageLink:has(img)',
  };

  private readonly settings = {
    showRecording: GM_getValue<boolean>("showRecording", true),
    showRelease: GM_getValue<boolean>("showRelease", false),
    autoCopyMbid: GM_getValue<boolean>("autoCopyMbid", false),
  };

  private readonly requestToken = { current: Symbol("init") };

  private readonly runner: ImporterRunner;
  private readonly scraper: NiconicoScraper;
  private readonly viewModel: NiconicoViewModel;
  private readonly renderer: NiconicoRenderer;
  private readonly transmitter: NiconicoTransmitter;

  private activeSession: ActiveSession = { videoId: null, videoDetails: null };

  private get videoId(): string | null {
    return this.activeSession.videoId;
  }

  constructor() {
    this.runner = createImporterRunner({
      appName: GM_info.script.name,
      appVersion: GM_info.script.version,
      appContact: GM_info.script.namespace,
    });

    this.scraper = new NiconicoScraper();
    this.viewModel = new NiconicoViewModel(this.runner, mbicon);
    this.renderer = new NiconicoRenderer(this.selectors);
    this.transmitter = new NiconicoTransmitter(this.settings.autoCopyMbid);

    this.init();
  }

  private init(): void {
    this.registerSettingsMenu();
    this.applyGlobalStyles();
    this.observeNavigation();
  }

  /* =========================================================
   *  IMPORTER
   *  extractContext / getQueries
   * ========================================================= */
  private readonly importer: SiteImporter<VideoContext> = {
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

    getQueries: (ctx: VideoContext): MBQuery[] => {
      const queries: MBQuery[] = [{ key: "source", url: ctx.details.sourceUrl, includes: ["recording-rels", "release-rels"] }];
      if (ctx.details.authorUrl) {
        queries.push({ key: "artist", url: ctx.details.authorUrl, includes: ["artist-rels"] });
      }
      return queries;
    },
  };

  /* =========================================================
   *  UI ライフサイクル
   *  runner から ctx / entries を受け取り、VM → Renderer へ流す。
   * ========================================================= */
  private attachUI(ctx: VideoContext): void {
    this.renderer.renderActionControls(this.viewModel.buildAction(ctx.videoId, this.settings.showRecording, this.settings.showRelease));
  }

  private updateUI(ctx: VideoContext, entries: Record<string, MBUrlEntry | null>): void {
    const sourceEntry = entries["source"] ?? null;
    const authorEntry = entries["artist"] ?? null;

    const artists = getRelationsByType(authorEntry, "artist");
    const artistMbid = artists[0]?.artist?.id ?? null;
    const authorUrlId = authorEntry?.id ?? null;

    this.renderer.renderArtistIndicator(this.viewModel.buildArtist(artistMbid, authorUrlId, artists.length));

    if (document.querySelector(".NicoToMbMasterContainer")) {
      this.renderer.renderVideoIndicators(this.viewModel.buildVideoIndicators(sourceEntry, ctx.videoId));
    }

    document.querySelectorAll<HTMLButtonElement>(".mb-transmit-btn[data-mb-type]").forEach((btn) => {
      const type = btn.getAttribute("data-mb-type") as "recording" | "release" | null;
      if (!type) return;
      btn.onclick = () => this.transmitter.transmit(type, ctx.details, artistMbid);
    });
  }

  private runImporter(): void {
    void this.runner.run(
      this.importer,
      this.requestToken,
      (ctx) => this.attachUI(ctx),
      (ctx, entries) => this.updateUI(ctx, entries),
      (pending) => syncMBButtons(".mb-transmit-btn", pending, i18n.t("loadingApi")),
      undefined,
      () => this.renderer.renderApiError(),
    );
  }

  /* =========================================================
   *  SETTINGS MENU
   * ========================================================= */
  private registerSettingsMenu(): void {
    const toggleEmoji = (val: boolean): string => (val ? "✅ ON" : "❌ OFF");
    const save = (key: string, val: boolean): void => {
      GM_setValue(key, val);
      location.reload();
    };

    GM_registerMenuCommand(`${i18n.t("menuRecording")}: ${toggleEmoji(this.settings.showRecording)}`, () => save("showRecording", !this.settings.showRecording));
    GM_registerMenuCommand(`${i18n.t("menuRelease")}:   ${toggleEmoji(this.settings.showRelease)}`, () => save("showRelease", !this.settings.showRelease));
    GM_registerMenuCommand(`${i18n.t("menuAutoCopy")}: ${toggleEmoji(this.settings.autoCopyMbid)}`, () => save("autoCopyMbid", !this.settings.autoCopyMbid));
  }

  /* =========================================================
   *  STYLES
   * ========================================================= */
  private applyGlobalStyles(): void {
    const { errorColor } = MB_DESIGN;
    GM_addStyle(`
            ${mbButtonBaseStyle("mb-transmit-btn", {
              height: "36px",
              padding: "0 16px",
              borderRadius: "18px",
              fontSize: "14px",
              fontWeight: "bold",
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

  /* =========================================================
   *  CONTROLLER: セッション管理 / DOM 監視 / ナビゲーション
   * ========================================================= */
  private initSession(): void {
    if (!location.pathname.startsWith("/watch/")) return;
    const videoId = location.pathname.split("/")[2];

    if (this.activeSession.videoId === videoId) return;

    this.renderer.reset();
    this.requestToken.current = Symbol();
    this.activeSession = { videoId, videoDetails: null };
  }

  private startWatching(): void {
    if (!location.pathname.startsWith("/watch/")) return;

    this.initSession();

    const { videoTitle, tagAnchor } = this.selectors;
    const hasTitle = (): boolean => !!document.querySelector(videoTitle);
    const hasTags = (): boolean => !!document.querySelector(tagAnchor);
    const hasLdJson = (): boolean => !!this.videoId && this.scraper.hasVideoLdJson(this.videoId);

    const tryRun = (): boolean => {
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

  private observeNavigation(): void {
    const patch = (type: "pushState" | "replaceState"): void => {
      const orig = history[type].bind(history);
      history[type] = (...args: Parameters<typeof history.pushState>): void => {
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

/* =========================================================
 *  INITIALIZATION
 * ========================================================= */
new NicoMusicBrainzBridge();
