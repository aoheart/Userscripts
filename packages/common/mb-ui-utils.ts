/**
 * MusicBrainz UI ユーティリティ
 *
 * UI共通処理を提供するモジュール。
 *
 * 提供:
 *   - MB_DESIGN
 *   - syncMBButtons
 *   - mbButtonBaseStyle
 *   - createMBButton
 *   - createMBIconLink
 */

/* =========================================================
 *  DESIGN TOKENS
 * ========================================================= */

/**
 * UIカラーの定数
 *
 * @example
 * GM_addStyle(`
 *   .btn { background: ${MB_DESIGN.brandColor}; }
 * `);
 */

export const MB_DESIGN = {
  brandColor: "#ba478f",
  brandHover: "#a53f7c",
  disabledBg: "#c0a0b4",
  errorColor: "#d9534f",
} as const;

/* =========================================================
 *  BUTTON STATE SYNC
 * ========================================================= */

/**
 * ボタンの disabled 状態とラベルを同期する。
 *
 * @example
 * syncMBButtons(".mb-transmit-btn", false, i18n.t("loadingApi"));
 */

export const syncMBButtons = (selector: string, pending: boolean, loadingLabel: string): void => {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((btn) => {
    btn.disabled = pending;
    btn.textContent = pending ? loadingLabel : (btn.getAttribute("data-original-label") ?? "");
  });
};

/* =========================================================
 *  IMPORT BUTTON STYLE GENERATOR
 * ========================================================= */

/**
 * @example
 * GM_addStyle(mbButtonBaseStyle("mb-transmit-button", {...}));
 */

export const mbButtonBaseStyle = (
  className: string,
  opts: {
    height?: string;
    padding?: string;
    borderRadius?: string;
    fontSize?: string;
    fontWeight?: string;
    brandColor?: string;
    brandHover?: string;
    disabledBg?: string;
  } = {},
): string => {
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

/* =========================================================
 *  IMPORT BUTTON FACTORY
 * ========================================================= */

/**
 * @example
 * const btn = createMBButton({
 *   id: "mb-import-btn",
 *   className: "mb-import-button",
 *   label: "Import",
 *   loadingLabel: "Loading...",
 *   pending: true,
 * });
 */

export const createMBButton = (opts: { id: string; className: string; label: string; loadingLabel: string; pending: boolean; onClick?: () => void }): HTMLButtonElement => {
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

/* =========================================================
 *  ICON LINK FACTORY
 * ========================================================= */

export const createMBIconLink = (opts: { id: string; href: string; iconSrc: string; tooltip: string; fallbackText?: string; className?: string; iconClassName?: string }): HTMLAnchorElement => {
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
