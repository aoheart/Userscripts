import mbicon from "@scripts/common/assets/musicbrainz-icon.svg?url";
import { createMBForm, submitMBForm } from "@scripts/common/mb-formsubmit";
import { MB_DESIGN, mbButtonBaseStyle, createMBButton, createMBIconLink, syncMBButtons } from "@scripts/common/mb-ui-utils";
import { MBQuery, MBUrlEntry, MBRelation, SiteImporter, ImporterRunner, createImporterRunner } from "@scripts/common/mb-importer-core";
import { createI18n } from "@scripts/common/i18n";

/* =========================================================
 *  i18n
 * ========================================================= */

const i18n = createI18n({
  ja: {
    importLabel: "Import to MusicBrainz",
    loadingApi: "MusicBrainzに照会中...",
    apiError: "MB APIエラー",
    tooltipArtist: "MusicBrainz: アーティスト登録済み",
    tooltipRelease: "MusicBrainz: リリース登録済み",
  },
  en: {
    importLabel: "Import to MusicBrainz",
    loadingApi: "Querying MusicBrainz...",
    apiError: "MB query failed",
    tooltipArtist: "MusicBrainz: Artist registered",
    tooltipRelease: "MusicBrainz: Release registered",
  },
});

/* =========================================================
 *  型定義
 * ========================================================= */

interface TrackData {
  title: string;
  artist: string;
  length: number;
}

interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: number | string;
  month: number | string;
  day: number | string;
  tracks: TrackData[];
  canonicalUrl: string;
  artistUrl: string | null;
}

/* =========================================================
 *  SCRAPER
 *  __NEXT_DATA__ の解析に特化する。
 * ========================================================= */

class AWAScraper {
  extract(): AlbumData | null {
    try {
      const nextDataTag = document.getElementById("__NEXT_DATA__");
      if (!nextDataTag) return null;

      const nextData = JSON.parse(nextDataTag.textContent ?? "");
      const albumStore = nextData?.props?.pageProps?.dehydrated?.context?.dispatcher?.stores?.AlbumStore;

      const urlId = window.location.pathname.split("/").pop() ?? "";
      const album = albumStore?.album?.map?.[urlId];

      if (!album?.tracks) return null;

      const relDate: Date | null = album.releasedAt ? new Date(album.releasedAt * 1000) : null;

      return {
        id: urlId,
        title: album.name,
        artist: album.artist?.name ?? "",
        year: relDate ? relDate.getUTCFullYear() : "",
        month: relDate ? relDate.getUTCMonth() + 1 : "",
        day: relDate ? relDate.getUTCDate() : "",
        tracks: album.tracks.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any): TrackData => ({
            title: t.name ?? "",
            artist: t.artistName ?? album.artist?.name ?? "",
            length: Math.round((t.playbackTime ?? 0) * 1000),
          }),
        ),
        canonicalUrl: window.location.origin + window.location.pathname,
        artistUrl: album.artist?.id ? `${window.location.origin}/artist/${album.artist.id as string}` : null,
      };
    } catch {
      return null;
    }
  }
}

/* =========================================================
 *  RENDERER
 *  DOM 操作に特化する。
 * ========================================================= */

class AWARenderer {
  constructor(
    private readonly artistLinkSelector: string,
    private readonly runner: ImporterRunner,
    private readonly iconSrc: string,
  ) {}

  reset(): void {
    document.getElementById("mb-api-error")?.remove();
  }

  renderApiError(): void {
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

  getOrCreateActionRow(): HTMLElement | null {
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

  renderActionButton(label: string, loadingLabel: string, onClick: () => void): void {
    const row = this.getOrCreateActionRow();
    if (!row || document.getElementById("mb-import-btn")) return;

    row.appendChild(
      createMBButton({
        id: "mb-import-btn",
        className: "mb-import-button",
        label,
        loadingLabel,
        pending: true,
        onClick,
      }),
    );
  }

  renderArtistIcon(href: string): void {
    if (document.getElementById("mb-artist-icon")) return;

    const artistLink = document.querySelector<HTMLElement>('a[href^="/artist/"]');
    if (!artistLink) return;

    const anchor = createMBIconLink({
      id: "mb-artist-icon",
      href,
      iconSrc: this.iconSrc,
      tooltip: i18n.t("tooltipArtist"),
      className: "mb-exist-icon-link",
      iconClassName: "mb-icon-img",
    });

    artistLink.insertAdjacentElement("afterend", anchor);
  }

  renderTitleIcon(urlId: string, relations: MBRelation[], retryCount = 0): void {
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
      iconClassName: "mb-icon-img",
    });

    h1.prepend(link);
  }
}

/* =========================================================
 *  TRANSMITTER
 *  MusicBrainz へのフォーム送信に特化する。
 * ========================================================= */

class AWATransmitter {
  private readonly scriptVer: string;

  constructor() {
    this.scriptVer = `${GM_info.script.name} (v${GM_info.script.version})`;
  }

  transmit(data: AlbumData): void {
    const params: Record<string, string | number> = {
      name: data.title,
      "artist_credit.names.0.name": data.artist,
      "date.year": data.year,
      "date.month": data.month,
      "date.day": data.day,
      packaging: "none",
      "mediums.0.format": "Digital Media",
      "urls.0.url": data.canonicalUrl,
      "urls.0.link_type": "980",
      edit_note: `Imported from AWA: ${data.canonicalUrl}\n---\n${this.scriptVer}`,
    };

    data.tracks.forEach((track, index) => {
      params[`mediums.0.track.${index}.name`] = track.title;
      params[`mediums.0.track.${index}.length`] = track.length;
      params[`mediums.0.track.${index}.artist_credit.names.0.name`] = track.artist;
    });

    submitMBForm(createMBForm("/release/add", params));
  }
}

/* =========================================================
 *  CONTROLLER
 *  各クラスを組み合わせて制御フローを管理する。
 * ========================================================= */

class AWAMusicBrainzBridge {
  private readonly selectors = {
    artistLink: 'a[href^="/artist/"]',
  };

  private readonly runner: ImporterRunner;
  private readonly scraper: AWAScraper;
  private readonly renderer: AWARenderer;
  private readonly transmitter: AWATransmitter;

  private readonly requestToken = { current: Symbol("init") };

  private lastProcessedId: string | null = null;

  constructor() {
    this.runner = createImporterRunner({
      appName: GM_info.script.name,
      appVersion: GM_info.script.version,
      appContact: GM_info.script.namespace,
    });

    this.scraper = new AWAScraper();
    this.renderer = new AWARenderer(this.selectors.artistLink, this.runner, mbicon);
    this.transmitter = new AWATransmitter();

    this.applyGlobalStyles();
    this.observeNavigation();
  }

  /* =========================================================
   *  IMPORTER
   * ========================================================= */

  private readonly importer: SiteImporter<AlbumData> = {
    siteId: "awa",

    extractContext: () => {
      if (!location.pathname.includes("/album/")) return null;

      const albumId = window.location.pathname.split("/").pop() ?? "";
      if (this.lastProcessedId === albumId && document.getElementById("mb-import-btn")) return null;

      return this.scraper.extract();
    },

    getQueries: (ctx: AlbumData): MBQuery[] => {
      const queries: MBQuery[] = [{ key: "source", url: ctx.canonicalUrl, includes: ["release-rels"] }];
      if (ctx.artistUrl) {
        queries.push({ key: "artist", url: ctx.artistUrl, includes: ["artist-rels"] });
      }
      return queries;
    },
  };

  /* =========================================================
   *  UI ライフサイクル
   *  runner から ctx / entries を受け取り、Renderer へ流す。
   * ========================================================= */

  private attachUI(ctx: AlbumData): void {
    this.lastProcessedId = ctx.id;
    this.renderer.reset();
    this.renderer.renderActionButton(i18n.t("importLabel"), i18n.t("loadingApi"), () => this.transmitter.transmit(ctx));
  }

  private updateUI(_ctx: AlbumData, entries: Record<string, MBUrlEntry | null>): void {
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

  /* =========================================================
   *  RUNNER
   * ========================================================= */

  private runImporter(): void {
    void this.runner.run(
      this.importer,
      this.requestToken,
      (ctx) => this.attachUI(ctx),
      (ctx, entries) => this.updateUI(ctx, entries),
      (pending) => syncMBButtons("#mb-import-btn", pending, i18n.t("loadingApi")),
      undefined,
      () => {
        this.renderer.renderApiError();
      },
    );
  }

  /* =========================================================
   *  STYLES
   * ========================================================= */

  private applyGlobalStyles(): void {
    GM_addStyle(`
      ${mbButtonBaseStyle("mb-import-button", {
        height: "32px",
        padding: "0 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
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

  /* =========================================================
   *  NAVIGATION OBSERVER
   * ========================================================= */

  private observeNavigation(): void {
    const observer = new MutationObserver(() => this.runImporter());
    observer.observe(document.body, { childList: true, subtree: true });
    this.runImporter();
  }
}

/* =========================================================
 *  INITIALIZATION
 * ========================================================= */
new AWAMusicBrainzBridge();
