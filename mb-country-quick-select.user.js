// ==UserScript==
// @name            MusicBrainz Country Quick Selector
// @namespace       https://github.com/aoheart/Userscripts
// @version         2026.04.03
// @author          aoheart
// @description     Streamlines country selection in the Release Editor with quick-access buttons.
// @description:ja  リリースエディタで国選択を簡単にするボタンを追加します
// @license         MIT
// @icon            data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNyAzMCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlYjc0M2I7fS5jbHMtMntmaWxsOiNiYTQ3OGY7fS5jbHMtM3tmaWxsOiNmZmZlZGI7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMy45NCAxIDEzLjk0IDI5IDI1LjkgMjIgMjUuOSA4IDEzLjk0IDEiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMTMuMDYgMSAxLjEgOCAxLjEgMjIgMTMuMDYgMjkgMTMuMDYgMSIvPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjA2LDExLjIxLDcuNTIsMTQuNDJWMTIuMDhsNS41NC0zLjJWNC41TDYuNjQsOC4zOGgwbC0uMDYsMCwwLDAsMCwwLDAsMCwwLC4wNXMwLDAsMCwuMDUsMCwwLDAsMGEuMTQuMTQsMCwwLDAsMCwuMDYuNDMuNDMsMCwwLDAsMCwuMDV2MTBhMi42MSwyLjYxLDAsMCwwLTEuNTYuM0ExLjksMS45LDAsMCwwLDQsMjEuNTNhMS44NiwxLjg2LDAsMCwwLDIuNTcuMTgsMi40MywyLjQzLDAsMCwwLDEtMS40NmMwLS4wNiwwLTQuMzcsMC00LjM3bDUuNTQtMy4yMVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0yMy4zNSwxNy4zNmExLjk0LDEuOTQsMCwwLDAtMS42Ni0uOTIsMS45LDEuOSwwLDAsMC0uNTguMDksNS4xNyw1LjE3LDAsMCwwLTIuNS0xLjY1LDguNjEsOC42MSwwLDAsMCwxLjcyLTEuNzksMi4wNiwyLjA2LDAsMCwwLDEuNS0uMjQsMiwyLDAsMSwwLTIuNzItLjYybC4xMi4xN2E2Ljg1LDYuODUsMCwwLDEtMi43NywyLjI3aDBhNS4zOCw1LjM4LDAsMCwxLTIuNTEuNjJ2MS40NmE2LjM2LDYuMzYsMCwwLDAsMi45Mi0uODUsNC4zMyw0LjMzLDAsMCwxLDMuMiwxLjM5LDIsMiwwLDAsMCwyLjY4LDIuNzksMiwyLDAsMCwwLC42MS0yLjcyWm0tMy02LjgzYS43NS43NSwwLDAsMSwuNDEtLjEyLjc2Ljc2LDAsMCwxLC40MSwxLjQxLjczLjczLDAsMCwxLS40MS4xMi43Mi43MiwwLDAsMS0uNC0uMTIuNjkuNjksMCwwLDEtLjI0LS4yNEEuNzYuNzYsMCwwLDEsMjAuMzcsMTAuNTNabTIuMDYsOGEuNzcuNzcsMCwwLDEtLjc0LjYuNzcuNzcsMCwwLDEtLjQ1LTEuMzlsMCwwYS43Ny43NywwLDAsMSwxLC4yNEEuNzIuNzIsMCwwLDEsMjIuNDMsMTguNThaIi8+PC9zdmc+
// @supportURL      https://github.com/aoheart/Userscripts/issues
// @downloadURL     https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/mb-country-quick-select.user.js
// @updateURL       https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/mb-country-quick-select.user.js
// @match           *://*.musicbrainz.org/release/add
// @match           *://*.musicbrainz.org/release/*/edit
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// ==/UserScript==

(function () {
  'use strict';

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
      dialogTitle: "国ボタンのカスタマイズ",
      selectedLabel: "選択済み（ドラッグまたは↑↓で並び替え）",
      addLabel: "国を追加（ISOコード・国名で検索）",
      searchPlaceholder: "例: JP / 日本",
      added: "追加済",
      add: "追加",
      showGear: "⚙️ を表示",
      resetDefault: "デフォルトに戻す",
      cancel: "キャンセル",
      save: "保存",
      remove: "削除",
      moveUp: "上へ",
      moveDown: "下へ",
      customize: "国ボタンをカスタマイズ",
      menuSettings: "🌏 国ボタンの設定"
    },
    en: {
      dialogTitle: "Customize Country Buttons",
      selectedLabel: "Selected (drag or ↑↓ to reorder)",
      addLabel: "Add countries (search by ISO code or name)",
      searchPlaceholder: "e.g. JP / Japan",
      added: "Added",
      add: "Add",
      showGear: "Show ⚙️",
      resetDefault: "Reset to defaults",
      cancel: "Cancel",
      save: "Save",
      remove: "Remove",
      moveUp: "Move up",
      moveDown: "Move down",
      customize: "Customize country buttons",
      menuSettings: "🌏 Country Button Settings"
    }
  });
  const COUNTRY_ISO_TO_ID = {
    XW: 240,
    IS: 98,
    IE: 103,
    AZ: 15,
    AF: 1,
    US: 222,
    VI: 231,
    AS: 4,
    AE: 220,
    DZ: 3,
    AR: 10,
    AW: 12,
    AL: 2,
    AM: 11,
    AI: 7,
    AO: 6,
    AG: 9,
    AD: 5,
    YE: 234,
    GB: 221,
    IO: 31,
    VG: 230,
    IL: 104,
    IT: 105,
    IQ: 102,
    IR: 101,
    IN: 99,
    ID: 100,
    WF: 232,
    UG: 218,
    UA: 219,
    UZ: 225,
    UY: 224,
    EC: 62,
    EG: 63,
    EE: 67,
    SZ: 201,
    ET: 68,
    ER: 66,
    SV: 64,
    AU: 13,
    AT: 14,
    AX: 250,
    OM: 161,
    NL: 150,
    AN: 151,
    GH: 82,
    CV: 39,
    GG: 251,
    GY: 92,
    KZ: 109,
    QA: 173,
    CA: 38,
    GA: 78,
    CM: 37,
    GM: 79,
    KH: 36,
    GN: 90,
    GW: 91,
    CY: 55,
    CU: 54,
    CW: 259,
    GR: 84,
    KI: 111,
    KG: 115,
    GT: 89,
    GP: 87,
    GU: 88,
    KW: 114,
    CK: 50,
    GL: 85,
    CX: 45,
    GE: 80,
    GD: 86,
    HR: 53,
    KY: 40,
    KE: 110,
    CI: 52,
    CC: 46,
    CR: 51,
    XK: 2358,
    KM: 48,
    CO: 47,
    CG: 49,
    CD: 236,
    SA: 184,
    GS: 248,
    WS: 181,
    BL: 255,
    MF: 256,
    ST: 183,
    ZM: 237,
    PM: 197,
    SM: 182,
    SL: 187,
    DJ: 58,
    GI: 83,
    JE: 253,
    JM: 106,
    SY: 204,
    SG: 188,
    SX: 260,
    ZW: 238,
    CH: 203,
    SJ: 200,
    SE: 202,
    SD: 198,
    ES: 194,
    SR: 199,
    LK: 195,
    SK: 189,
    SI: 190,
    SC: 186,
    SN: 185,
    RS: 254,
    CS: 242,
    KN: 178,
    VC: 180,
    SH: 196,
    LC: 179,
    SU: 243,
    SO: 192,
    SB: 191,
    TC: 216,
    TH: 208,
    TJ: 206,
    TZ: 207,
    CZ: 56,
    TD: 42,
    TN: 213,
    CL: 43,
    TV: 217,
    DK: 57,
    DE: 81,
    TR: 214,
    TG: 209,
    TK: 210,
    DO: 60,
    DM: 59,
    TT: 212,
    TM: 215,
    TO: 211,
    NG: 156,
    NR: 148,
    NA: 147,
    NU: 157,
    NI: 154,
    NE: 155,
    NC: 152,
    NZ: 153,
    NP: 149,
    NF: 158,
    NO: 160,
    HM: 94,
    BH: 17,
    HT: 93,
    PK: 162,
    VA: 227,
    PA: 164,
    VU: 226,
    BS: 16,
    PG: 165,
    BM: 24,
    PW: 163,
    PY: 166,
    BB: 19,
    PS: 249,
    HU: 97,
    BD: 18,
    PN: 169,
    FJ: 71,
    PH: 168,
    FI: 72,
    BT: 25,
    BV: 29,
    PR: 172,
    FO: 70,
    FK: 69,
    BR: 30,
    FR: 73,
    GF: 75,
    PF: 76,
    TF: 77,
    BG: 33,
    BF: 34,
    BN: 32,
    BI: 35,
    VN: 229,
    BJ: 23,
    VE: 228,
    BY: 20,
    BZ: 22,
    PE: 167,
    BE: 21,
    PL: 170,
    BA: 27,
    BW: 28,
    BQ: 258,
    BO: 26,
    PT: 171,
    HN: 95,
    MH: 133,
    MO: 125,
    MG: 127,
    YT: 137,
    MW: 128,
    ML: 131,
    MT: 132,
    MQ: 134,
    MY: 129,
    IM: 252,
    FM: 139,
    MM: 146,
    MX: 138,
    MU: 136,
    MR: 135,
    MZ: 145,
    MC: 141,
    MV: 130,
    MD: 140,
    MA: 144,
    MN: 142,
    ME: 247,
    MS: 143,
    YU: 235,
    EU: 241,
    JO: 108,
    LA: 116,
    LV: 117,
    LT: 123,
    LY: 121,
    LI: 122,
    LR: 120,
    RO: 175,
    LU: 124,
    RW: 177,
    LS: 119,
    LB: 118,
    RE: 174,
    RU: 176,
    KR: 113,
    HK: 96,
    UM: 223,
    EH: 233,
    GQ: 65,
    TW: 205,
    CF: 41,
    CN: 44,
    TL: 61,
    DD: 244,
    ZA: 193,
    SS: 257,
    AQ: 8,
    JP: 107,
    MK: 126,
    MP: 159,
    KP: 112
  };
  const _nameCache = {};
  function countryName(iso) {
    if (_nameCache[iso] !== void 0) return _nameCache[iso];
    const id = COUNTRY_ISO_TO_ID[iso];
    if (id !== void 0) {
      const opt = document.querySelector(`select[id^="country-"] option[value="${id}"]`);
      if (opt) {
        _nameCache[iso] = opt.textContent?.trim() ?? iso;
        return _nameCache[iso];
      }
    }
    _nameCache[iso] = iso;
    return iso;
  }
  const ALL_ISO_CODES = Object.keys(COUNTRY_ISO_TO_ID).sort();
  const KEY_COUNTRIES = "mb_country_list";
  const KEY_SHOW_GEAR = "mb_show_gear";
  const DEFAULT_COUNTRIES = ["JP", "XW", "US", "TW"];
  function loadSettings() {
    let countries = [];
    try {
      const raw = GM_getValue(KEY_COUNTRIES, null);
      if (raw) countries = JSON.parse(raw);
    } catch {
    }
    if (!Array.isArray(countries) || countries.length === 0) {
      countries = [...DEFAULT_COUNTRIES];
    }
    const showGear = GM_getValue(KEY_SHOW_GEAR, true);
    return { countries, showGear };
  }
  function saveSettings(s) {
    GM_setValue(KEY_COUNTRIES, JSON.stringify(s.countries));
    GM_setValue(KEY_SHOW_GEAR, s.showGear);
  }
  const settings = loadSettings();
  function setNativeValue(el, value) {
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    if (desc?.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const CONTAINER_ATTR = "data-country-btns";
  const BTN_ROW_ATTR = "data-country-btn-row";
  const BUTTONS_PER_ROW = 5;
  function buildButtonContainer(selectEl) {
    const wrap = document.createElement("span");
    wrap.setAttribute(CONTAINER_ATTR, "1");
    wrap.style.cssText = `
    display: inline-grid;
    grid-template-columns: repeat(${BUTTONS_PER_ROW}, auto);
    gap: 3px;
    white-space: nowrap;
  `;
    renderButtons(wrap, selectEl);
    return wrap;
  }
  function renderButtons(wrap, selectEl) {
    wrap.innerHTML = "";
    for (const iso of settings.countries) {
      const id = COUNTRY_ISO_TO_ID[iso];
      if (id === void 0) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = iso;
      btn.title = countryName(iso);
      btn.style.cssText = `
      padding: 2px 6px; font-size: 11px; cursor: pointer;
      border: 1px solid #aaa; border-radius: 3px;
      background: #eee; line-height: 1.4;
    `;
      btn.addEventListener("click", () => setNativeValue(selectEl, String(id)));
      wrap.appendChild(btn);
    }
    if (settings.showGear) {
      const gear = document.createElement("button");
      gear.type = "button";
      gear.textContent = "⚙️";
      gear.title = i18n.t("customize");
      gear.style.cssText = `
      padding: 2px 4px; font-size: 11px; cursor: pointer;
      border: 1px solid #aaa; border-radius: 3px; background: #eee;
    `;
      gear.addEventListener("click", openSettingsDialog);
      wrap.appendChild(gear);
    }
  }
  function injectIntoRow(row) {
    const select = row.querySelector('select[id^="country-"]');
    if (!select) return;
    const next = row.nextElementSibling;
    if (next?.hasAttribute(BTN_ROW_ATTR)) return;
    const wrap = buildButtonContainer(select);
    const cells = [...row.querySelectorAll("td,th")];
    const selectTd = select.closest("td,th");
    let colsBefore = 0, selectSpan = 1, colsAfter = 0, found = false;
    for (const cell of cells) {
      const span = parseInt(cell.getAttribute("colspan") ?? "1", 10);
      if (cell === selectTd) {
        found = true;
        selectSpan = span;
      } else if (!found) {
        colsBefore += span;
      } else {
        colsAfter += span;
      }
    }
    const btnRow = document.createElement("tr");
    btnRow.setAttribute(BTN_ROW_ATTR, "1");
    if (colsBefore > 0) {
      const emptyTd = document.createElement("td");
      emptyTd.setAttribute("colspan", String(colsBefore));
      btnRow.appendChild(emptyTd);
    }
    const btnTd = document.createElement("td");
    btnTd.setAttribute("colspan", String(selectSpan + colsAfter));
    btnTd.style.cssText = "padding: 2px 0 4px 0; border: none;";
    btnTd.appendChild(wrap);
    btnRow.appendChild(btnTd);
    row.insertAdjacentElement("afterend", btnRow);
  }
  function scanRows(root = document) {
    root.querySelectorAll("tr").forEach(injectIntoRow);
  }
  function refreshAllContainers() {
    document.querySelectorAll(`[${BTN_ROW_ATTR}]`).forEach((btnRow) => {
      const wrap = btnRow.querySelector(`[${CONTAINER_ATTR}]`);
      const select = btnRow.previousElementSibling?.querySelector('select[id^="country-"]');
      if (wrap && select) renderButtons(wrap, select);
    });
    scanRows();
  }
  const pendingMutations = [];
  let rafScheduled = false;
  function processMutations() {
    rafScheduled = false;
    const batch = pendingMutations.splice(0);
    for (const m of batch) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const el = node;
        if (el.hasAttribute(BTN_ROW_ATTR)) continue;
        if (el.matches("tr")) {
          injectIntoRow(el);
        } else {
          el.querySelectorAll("tr").forEach((r) => {
            if (!r.hasAttribute(BTN_ROW_ATTR)) injectIntoRow(r);
          });
        }
      }
    }
  }
  new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(processMutations);
    }
  }).observe(document.body, { childList: true, subtree: true });
  let dialogEl = null;
  let selectedListEl = null;
  let searchInputEl = null;
  let searchResultsEl = null;
  let tempCountries = [];
  let dragSrcISO = null;
  function openSettingsDialog() {
    if (dialogEl) {
      dialogEl.style.display = "flex";
      return;
    }
    tempCountries = [...settings.countries];
    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center;";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDialog();
    });
    const dialog = document.createElement("div");
    dialog.style.cssText = "background: #fff; border-radius: 8px; padding: 16px; width: 560px; height: 500px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 24px rgba(0,0,0,0.35); font-family: sans-serif; font-size: 13px; box-sizing: border-box; overflow: hidden;";
    const titleEl = document.createElement("h3");
    titleEl.textContent = i18n.t("dialogTitle");
    titleEl.style.cssText = "margin: 0; font-size: 15px; flex-shrink: 0;";
    dialog.appendChild(titleEl);
    const cols = document.createElement("div");
    cols.style.cssText = "display: flex; gap: 12px; flex: 1; min-height: 0;";
    const leftCol = document.createElement("div");
    leftCol.style.cssText = "flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;";
    const leftLabel = document.createElement("div");
    leftLabel.style.cssText = "font-weight: bold; flex-shrink: 0; font-size: 12px;";
    leftLabel.textContent = i18n.t("selectedLabel");
    leftCol.appendChild(leftLabel);
    selectedListEl = document.createElement("ul");
    selectedListEl.style.cssText = "list-style: none; margin: 0; padding: 0; border: 1px solid #ccc; border-radius: 4px; flex: 1; min-height: 0; overflow-y: scroll;";
    leftCol.appendChild(selectedListEl);
    cols.appendChild(leftCol);
    const rightCol = document.createElement("div");
    rightCol.style.cssText = "flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;";
    const rightLabel = document.createElement("div");
    rightLabel.style.cssText = "font-weight: bold; flex-shrink: 0; font-size: 12px;";
    rightLabel.textContent = i18n.t("addLabel");
    rightCol.appendChild(rightLabel);
    searchInputEl = document.createElement("input");
    searchInputEl.type = "text";
    searchInputEl.placeholder = i18n.t("searchPlaceholder");
    searchInputEl.style.cssText = "width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; flex-shrink: 0;";
    searchInputEl.addEventListener("input", renderSearchResults);
    rightCol.appendChild(searchInputEl);
    const searchWrap = document.createElement("div");
    searchWrap.style.cssText = "flex: 1; min-height: 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; position: relative;";
    searchResultsEl = document.createElement("ul");
    searchResultsEl.style.cssText = "list-style: none; margin: 0; padding: 0; width: 100%; height: 100%; overflow-y: scroll; box-sizing: border-box;";
    searchWrap.appendChild(searchResultsEl);
    rightCol.appendChild(searchWrap);
    cols.appendChild(rightCol);
    dialog.appendChild(cols);
    const optRow = document.createElement("div");
    optRow.style.cssText = "display: flex; align-items: center; gap: 12px; flex-shrink: 0;";
    const gearLabel = document.createElement("label");
    gearLabel.style.cssText = "display: flex; align-items: center; gap: 6px; cursor: pointer;";
    const gearCheck = document.createElement("input");
    gearCheck.type = "checkbox";
    gearCheck.checked = settings.showGear;
    gearLabel.appendChild(gearCheck);
    gearLabel.appendChild(document.createTextNode(i18n.t("showGear")));
    optRow.appendChild(gearLabel);
    dialog.appendChild(optRow);
    const actionRow = document.createElement("div");
    actionRow.style.cssText = "display: flex; justify-content: space-between; gap: 8px; flex-shrink: 0;";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = i18n.t("resetDefault");
    resetBtn.style.cssText = "padding: 5px 12px; cursor: pointer;";
    resetBtn.addEventListener("click", () => {
      tempCountries = [...DEFAULT_COUNTRIES];
      renderSelectedList();
    });
    actionRow.appendChild(resetBtn);
    const rightBtns = document.createElement("div");
    rightBtns.style.cssText = "display: flex; gap: 8px;";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = i18n.t("cancel");
    cancelBtn.style.cssText = "padding: 5px 12px; cursor: pointer;";
    cancelBtn.addEventListener("click", closeDialog);
    rightBtns.appendChild(cancelBtn);
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = i18n.t("save");
    saveBtn.style.cssText = "padding: 5px 12px; cursor: pointer; background: #4a90d9; color: #fff; border: 1px solid #3a7bbf; border-radius: 4px;";
    saveBtn.addEventListener("click", () => {
      settings.countries = [...tempCountries];
      settings.showGear = gearCheck.checked;
      saveSettings(settings);
      refreshAllContainers();
      closeDialog();
    });
    rightBtns.appendChild(saveBtn);
    actionRow.appendChild(rightBtns);
    dialog.appendChild(actionRow);
    overlay.appendChild(dialog);
    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
    dialogEl = overlay;
    renderSelectedList();
    renderSearchResults();
  }
  function closeDialog() {
    if (dialogEl) {
      dialogEl.remove();
      dialogEl = null;
      document.body.style.overflow = "";
    }
    selectedListEl = searchInputEl = searchResultsEl = null;
  }
  function renderSelectedList() {
    if (!selectedListEl) return;
    selectedListEl.innerHTML = "";
    tempCountries.forEach((iso, idx) => {
      const li = document.createElement("li");
      li.dataset.iso = iso;
      li.draggable = true;
      li.style.cssText = "display: flex; align-items: flex-start; padding: 4px 6px; gap: 4px; border-bottom: 1px solid #eee; user-select: none; cursor: grab; box-sizing: border-box;";
      const handle = document.createElement("span");
      handle.textContent = "☰";
      handle.style.cssText = "color: #bbb; font-size: 13px; flex-shrink: 0; margin-top: 1px;";
      li.appendChild(handle);
      const badge = document.createElement("span");
      badge.textContent = iso;
      badge.style.cssText = "font-weight: bold; min-width: 30px; font-family: monospace; flex-shrink: 0; margin-top: 1px;";
      li.appendChild(badge);
      const name = document.createElement("span");
      name.textContent = countryName(iso);
      name.style.cssText = "flex: 1; color: #555; font-size: 11px; word-break: break-all; line-height: 1.4;";
      li.appendChild(name);
      const controls = document.createElement("span");
      controls.style.cssText = "display: flex; align-items: center; gap: 2px; flex-shrink: 0;";
      const arrowCSS = "border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; cursor: pointer; padding: 1px 4px; font-size: 9px; line-height: 1.4;";
      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.textContent = "▲";
      upBtn.disabled = idx === 0;
      upBtn.style.cssText = arrowCSS;
      upBtn.addEventListener("click", () => {
        [tempCountries[idx - 1], tempCountries[idx]] = [tempCountries[idx], tempCountries[idx - 1]];
        renderSelectedList();
      });
      controls.appendChild(upBtn);
      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.textContent = "▼";
      downBtn.disabled = idx === tempCountries.length - 1;
      downBtn.style.cssText = arrowCSS;
      downBtn.addEventListener("click", () => {
        [tempCountries[idx], tempCountries[idx + 1]] = [tempCountries[idx + 1], tempCountries[idx]];
        renderSelectedList();
      });
      controls.appendChild(downBtn);
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.style.cssText = "border: none; background: none; cursor: pointer; color: #c00; font-size: 12px; padding: 0 2px;";
      delBtn.addEventListener("click", () => {
        tempCountries.splice(idx, 1);
        renderSelectedList();
      });
      controls.appendChild(delBtn);
      li.appendChild(controls);
      li.addEventListener("dragstart", (e) => {
        dragSrcISO = iso;
        li.style.opacity = "0.4";
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => {
        dragSrcISO = null;
        li.style.opacity = "1";
        selectedListEl?.querySelectorAll("[data-drag-over]").forEach((el) => {
          el.removeAttribute("data-drag-over");
          el.style.borderTop = "";
        });
      });
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragSrcISO && dragSrcISO !== iso) {
          li.setAttribute("data-drag-over", "1");
          li.style.borderTop = "2px solid #4a90d9";
        }
      });
      li.addEventListener("dragleave", () => {
        li.removeAttribute("data-drag-over");
        li.style.borderTop = "";
      });
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.removeAttribute("data-drag-over");
        li.style.borderTop = "";
        if (!dragSrcISO || dragSrcISO === iso) return;
        const sIdx = tempCountries.indexOf(dragSrcISO);
        const dIdx = tempCountries.indexOf(iso);
        if (sIdx === -1 || dIdx === -1) return;
        tempCountries.splice(sIdx, 1);
        tempCountries.splice(dIdx, 0, dragSrcISO);
        renderSelectedList();
      });
      selectedListEl.appendChild(li);
    });
    renderSearchResults();
  }
  function renderSearchResults() {
    if (!searchResultsEl) return;
    const query = (searchInputEl?.value ?? "").toLowerCase().trim();
    const results = query ? ALL_ISO_CODES.filter((iso) => iso.toLowerCase().includes(query) || countryName(iso).toLowerCase().includes(query)) : ALL_ISO_CODES;
    searchResultsEl.innerHTML = "";
    for (const iso of results) {
      const already = tempCountries.includes(iso);
      const li = document.createElement("li");
      li.style.cssText = `display: flex; align-items: flex-start; padding: 4px 6px; gap: 5px; border-bottom: 1px solid #eee; background: ${already ? "#f0f8f0" : "#fff"}; box-sizing: border-box;`;
      const badge = document.createElement("span");
      badge.textContent = iso;
      badge.style.cssText = "font-weight: bold; min-width: 30px; font-family: monospace; color: #333; flex-shrink: 0; font-size: 12px; margin-top: 1px;";
      li.appendChild(badge);
      const name = document.createElement("span");
      name.textContent = countryName(iso);
      name.style.cssText = "flex: 1; color: #555; font-size: 11px; word-break: break-all; line-height: 1.4;";
      li.appendChild(name);
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.textContent = already ? i18n.t("added") : i18n.t("add");
      addBtn.disabled = already;
      addBtn.style.cssText = `flex-shrink: 0; width: 48px; padding: 2px 0; text-align: center; cursor: ${already ? "default" : "pointer"}; border: 1px solid ${already ? "#bbb" : "#4a90d9"}; border-radius: 3px; background: ${already ? "#e0e0e0" : "#4a90d9"}; color: ${already ? "#888" : "#fff"}; font-size: 11px; margin-top: 1px;`;
      addBtn.addEventListener("click", () => {
        if (!tempCountries.includes(iso)) {
          tempCountries.push(iso);
          renderSelectedList();
        }
      });
      li.appendChild(addBtn);
      searchResultsEl.appendChild(li);
    }
  }
  GM_registerMenuCommand(i18n.t("menuSettings"), openSettingsDialog);
  const init = () => scanRows();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();