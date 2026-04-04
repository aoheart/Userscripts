import { CollectResult, extractReleaseMbid, ParsedMbid, seedToMusicBrainz, StateCallback, UrlEntry } from "./mb-seeder-utils";

/* =========================================================
 *  TYPES
 * ========================================================= */

export interface ServiceEntry {
  id: string;
  label: string;
  isHarmony?: boolean;
  unverified?: boolean;
}

export interface SaveResult {
  enabledIds: string[];
  showSettingsBtn: boolean;
  showCopyBtn: boolean;
  includeHiRes: boolean;
}

export interface SettingsModalOptions {
  /** 表示するサービス一覧 */
  services: ServiceEntry[];
  /** id → 初期チェック状態 */
  isEnabled: (id: string) => boolean;
  /** 保存時コールバック */
  onSave: (result: SaveResult) => void;
  /** 設定ボタンの現在の表示状態（初期チェック状態に使用） */
  showSettingsBtn: boolean;
  /** コピーボタンの現在の表示状態（初期チェック状態に使用） */
  showCopyBtn: boolean;
  /** Hi-Res トグルの初期チェック状態。省略時はトグル自体を非表示にする */
  includeHiRes?: boolean;
  /**
   * 未知サービスセクション（linkfire専用）。
   * 省略時はセクション自体を非表示にする。
   */
  unknownSection?: {
    checked: boolean;
    /** このページで検出された未知サービスの label 一覧（補足表示用） */
    labelsOnPage: string[];
  };
}

/** "__unknown__" の予約 ID。未知サービスの includeUnknown フラグを enabledIds に統合するために使用 */
export const UNKNOWN_SERVICE_ID = "__unknown__";

/* =========================================================
 *  IMPORTER SETTINGS
 * ========================================================= */

export interface ImporterSettings {
  enabledIds: string[];
  showSettingsBtn: boolean;
  showCopyBtn: boolean;
  includeHiRes?: boolean;
}

/**
 * GM_getValue / GM_setValue ベースの設定管理オブジェクトを生成する。
 * key はスクリプトごとに異なる SETTINGS_KEY を渡す。
 * defaultEnabledIds はストレージ未保存時のデフォルト enabledIds を返す関数。
 */
export function createImporterSettings(key: string, defaultEnabledIds: () => string[]) {
  function load(): ImporterSettings | null {
    const raw = GM_getValue<string | null>(key, null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ImporterSettings;
    } catch {
      return null;
    }
  }

  function save(settings: ImporterSettings): void {
    GM_setValue(key, JSON.stringify(settings));
  }

  function getEnabledIds(): string[] {
    const saved = load();
    if (!saved || !Array.isArray(saved.enabledIds)) return defaultEnabledIds();
    return saved.enabledIds;
  }

  function getShowSettingsBtn(): boolean {
    return load()?.showSettingsBtn ?? true;
  }

  function getShowCopyBtn(): boolean {
    return load()?.showCopyBtn ?? true;
  }

  function getIncludeHiRes(): boolean {
    return load()?.includeHiRes ?? false;
  }

  function saveAll(enabledIds: string[], showSettingsBtn: boolean, showCopyBtn: boolean, includeHiRes = false): void {
    save({ enabledIds, showSettingsBtn, showCopyBtn, includeHiRes });
  }

  return { getEnabledIds, getShowSettingsBtn, getShowCopyBtn, getIncludeHiRes, saveAll };
}

/* =========================================================
 *  INTERNAL HELPERS
 * ========================================================= */

function createStyledButton(text: string, bg: string, color: string): HTMLButtonElement {
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
    fontWeight: "bold",
  });
  return btn;
}

/* =========================================================
 *  buildSettingsModal
 * ========================================================= */

/**
 * サービス有効/無効を設定するモーダルを生成して返す。
 * 呼び出し元が document.body.appendChild() して表示する。
 *
 * - lnk.to 実装ベース（スクロールエリア、Harmony セクション、未知サービスセクション）
 * - Shift クリックによる範囲選択対応
 * - 未知サービスセクションは unknownSection オプションが指定された場合のみ表示
 * - Hi-Res トグルは includeHiRes オプションが指定された場合のみ表示
 */
export function buildSettingsModal(opts: SettingsModalOptions): HTMLDivElement {
  const { services, isEnabled, onSave, showSettingsBtn, showCopyBtn, includeHiRes, unknownSection } = opts;

  /* ---------- overlay ---------- */
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
    justifyContent: "center",
  });

  /* ---------- modal ---------- */
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
    zIndex: "999999",
  });

  const title = document.createElement("div");
  title.textContent = "⚙ 設定";
  Object.assign(title.style, {
    fontSize: "15px",
    fontWeight: "bold",
    marginBottom: "16px",
    color: "#89b4fa",
    flexShrink: "0",
  });
  modal.appendChild(title);

  /* ---------- scroll area ---------- */
  const scrollArea = document.createElement("div");
  Object.assign(scrollArea.style, {
    overflowY: "auto",
    flex: "1",
    paddingRight: "24px",
  });

  /* ---------- checkbox registry (for Shift-click) ---------- */
  const allCheckboxes: HTMLInputElement[] = [];
  let lastCheckedIndex = -1;

  const CB_STYLE: Partial<CSSStyleDeclaration> = {
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
    accentColor: "#89b4fa",
  };

  function makeRow(container: HTMLElement, id: string, labelText: string, checked: boolean, unverified?: boolean): HTMLInputElement {
    const row = document.createElement("label");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "5px 0",
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

  /* ---------- コピー設定セクション（Hi-Res / unknown） ---------- */
  const hasCopySettings = includeHiRes !== undefined || !!unknownSection;
  if (hasCopySettings) {
    const copySettingsTitle = document.createElement("div");
    copySettingsTitle.textContent = "コピー設定";
    Object.assign(copySettingsTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
    scrollArea.appendChild(copySettingsTitle);
  }

  /* ---------- Hi-Res トグル（オプション） ---------- */
  let hiResCb: HTMLInputElement | null = null;
  if (includeHiRes !== undefined) {
    const hiResSection = document.createElement("div");
    const hiResRow = document.createElement("label");
    Object.assign(hiResRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "5px 0",
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

  /* ---------- unknown services section (linkfire専用) ---------- */
  let unknownCb: HTMLInputElement | null = null;
  if (unknownSection) {
    const section = document.createElement("div");

    const row = document.createElement("label");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "5px 0",
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
        wordBreak: "break-all",
      });
      section.appendChild(note);
    }

    scrollArea.appendChild(section);
  }

  /* ---------- normal services ---------- */
  const normalServices = services.filter((s) => !s.isHarmony);
  const harmonyServices = services.filter((s) => s.isHarmony);

  const hasAboveServices = includeHiRes !== undefined || !!unknownSection;
  if (normalServices.length > 0) {
    const section = document.createElement("div");
    Object.assign(section.style, {
      marginTop: hasAboveServices ? "16px" : "0",
      paddingTop: hasAboveServices ? "12px" : "0",
      borderTop: hasAboveServices ? "1px solid #45475a" : "none",
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

  /* ---------- import tools section ---------- */
  if (harmonyServices.length > 0) {
    const hasAboveHarmony = normalServices.length > 0 || hasAboveServices;
    const section = document.createElement("div");
    Object.assign(section.style, {
      marginTop: hasAboveHarmony ? "16px" : "0",
      paddingTop: hasAboveHarmony ? "12px" : "0",
      borderTop: hasAboveHarmony ? "1px solid #45475a" : "none",
    });

    // normalServices が空の場合にのみ「コピー対象サービス」ラベルを import tools セクション側に出す
    if (normalServices.length === 0) {
      const servicesTitle = document.createElement("div");
      servicesTitle.textContent = "コピー対象サービス";
      Object.assign(servicesTitle.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
      section.appendChild(servicesTitle);
    }

    const header = document.createElement("div");
    Object.assign(header.style, { marginBottom: "6px", fontSize: "12px", color: "#a6adc8" });
    const makeToolLink = (text: string, href: string): HTMLAnchorElement => {
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

  /* ---------- UI section ---------- */
  const uiSection = document.createElement("div");
  const hasAboveUi = normalServices.length > 0 || harmonyServices.length > 0 || !!unknownSection;
  Object.assign(uiSection.style, {
    marginTop: hasAboveUi ? "16px" : "0",
    paddingTop: hasAboveUi ? "12px" : "0",
    borderTop: hasAboveUi ? "1px solid #45475a" : "none",
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
    padding: "5px 0",
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
    padding: "5px 0",
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

  /* ---------- button row ---------- */
  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "16px",
    paddingRight: "24px",
    flexShrink: "0",
  });

  function closeModal(): void {
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
      includeHiRes: hiResCb?.checked ?? false,
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

/* =========================================================
 *  MENU COMMAND
 * ========================================================= */

/**
 * スクリプトマネージャーのメニューに「設定を開く」コマンドを登録する。
 * 設定ボタンが非表示の場合でもモーダルへアクセスできるようにするため、
 * injectUI() の後に呼び出す。
 */
export function registerMenuCommand(openModal: () => void): void {
  GM_registerMenuCommand("⚙ MBインポーター設定を開く", openModal);
}

/* =========================================================
 *  IMPORTER WIDGET
 * ========================================================= */

export interface ImporterWidgetOptions {
  /** URL収集（サイト固有）。collectAndCopy / collectAndSeed の内部で使用 */
  collectUrls: (onProgress: StateCallback) => Promise<CollectResult>;
  /** 設定モーダルを開く（サイト固有） */
  openSettings: () => void;
  /** 設定ボタンの初期表示状態 */
  showSettingsBtn: boolean;
  /** コピーボタンの初期表示状態 */
  showCopyBtn: boolean;
  /** 生成した wrapper を DOM に挿入する（サイト固有） */
  mount: (wrapper: HTMLElement) => void;
}

export interface ImporterWidgetHandle {
  /** 設定変更時に呼び出すことでURLキャッシュを破棄する */
  clearCache: () => void;
}

function createWidgetButton(text: string, bg: string, color: string): HTMLButtonElement {
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
    transition: "opacity 0.2s",
  });
  return btn;
}

function makeProcessingButton(btn: HTMLButtonElement, _defaultLabel?: string): StateCallback {
  return (label, processing) => {
    btn.textContent = label;
    btn.disabled = processing;
    btn.style.opacity = processing ? "0.7" : "1";
    btn.style.cursor = processing ? "wait" : "pointer";
  };
}

/**
 * Copy All / ⚙ / MBID入力 / Seed の共通ウィジェットを生成・マウントする。
 * URL収集・設定モーダル・挿入点はオプションで注入する。
 */
export function buildImporterWidget(opts: ImporterWidgetOptions): ImporterWidgetHandle {
  const { collectUrls, openSettings, showSettingsBtn, showCopyBtn, mount } = opts;

  // キャッシュ
  let cachedEntries: UrlEntry[] | null = null;

  async function getEntries(onProgress: StateCallback): Promise<CollectResult> {
    if (cachedEntries) return { entries: cachedEntries };
    const result = await collectUrls(onProgress);
    if ("entries" in result) cachedEntries = result.entries;
    return result;
  }

  async function collectAndCopy(setState: StateCallback): Promise<void> {
    const result = await getEntries(setState);
    if ("error" in result) {
      setState(result.error === "nolinks" ? "⚠ リンクなし" : "⚠ 対象URL無し", false);
    } else {
      GM_setClipboard(result.entries.map((e) => e.url).join("\n"), "text");
      setState(`✓ ${result.entries.length}件 コピー済`, false);
    }
    setTimeout(() => setState("copy", false), 2500);
  }

  async function collectAndSeed(parsed: ParsedMbid | null, setState: StateCallback): Promise<void> {
    const result = await getEntries(setState);
    if ("error" in result) {
      setState(result.error === "nolinks" ? "⚠ リンクなし" : "⚠ 対象URL無し", false);
    } else {
      seedToMusicBrainz(result.entries, parsed);
      setState(`✓ ${result.entries.length}件 Seed済`, false);
    }
    setTimeout(() => setState("send", false), 2500);
  }

  /* ---------- wrapper ---------- */
  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    margin: "12px 16px",
  });

  const leftGroup = document.createElement("div");
  Object.assign(leftGroup.style, { display: "flex", alignItems: "center", gap: "8px" });

  const rightGroup = document.createElement("div");
  Object.assign(rightGroup.style, { display: "flex", alignItems: "center", gap: "8px" });

  /* ---------- Copy All ---------- */
  const copyButton = createWidgetButton("copy", "linear-gradient(135deg, #89b4fa, #b4befe)", "#1e1e2e");
  copyButton.style.display = showCopyBtn ? "" : "none";
  let isCopyProcessing = false;
  const setCopyState = makeProcessingButton(copyButton, "Copy All");
  const setCopyStateGuarded: StateCallback = (label, processing) => {
    isCopyProcessing = processing;
    setCopyState(label, processing);
  };
  copyButton.addEventListener("click", () => {
    if (!isCopyProcessing) collectAndCopy(setCopyStateGuarded);
  });

  /* ---------- 設定ボタン ---------- */
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
    display: showSettingsBtn ? "" : "none",
  });
  settingsBtn.addEventListener("click", () => openSettings());

  /* ---------- MBID 入力欄 ---------- */
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
    transition: "border-color 0.15s",
  });
  mbidInput.addEventListener("input", () => {
    const val = mbidInput.value.trim();
    mbidInput.style.borderColor = val === "" || extractReleaseMbid(val) !== null ? "#45475a" : "#f38ba8";
  });

  /* ---------- Seed ---------- */
  const seedButton = createWidgetButton("send", "#ba478f", "#cdd6f4");
  seedButton.style.whiteSpace = "nowrap";
  let isSeedProcessing = false;
  const setSeedState = makeProcessingButton(seedButton, "Seed");
  const setSeedStateGuarded: StateCallback = (label, processing) => {
    isSeedProcessing = processing;
    setSeedState(label, processing);
  };

  function doSeed(): void {
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

  /* ---------- assemble ---------- */
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
    },
  };
}
